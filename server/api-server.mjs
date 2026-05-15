import { createServer } from 'node:http'
import { mkdir, readFile, appendFile, writeFile, rename } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'

const PORT = Number(process.env.PORT ?? 8787)
const ROOT = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const SITES_PATH = resolve(ROOT, 'server/data/sites.json')
const LOG_PATH = resolve(ROOT, 'server/logs/queries.jsonl')
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_REFERER = process.env.OPENROUTER_REFERER ?? 'https://shakecursor.com'
const OPENROUTER_APP_TITLE = process.env.OPENROUTER_APP_TITLE ?? 'Shake Cursor SDK'
const DEFAULT_OPENROUTER_MODEL = 'qwen/qwen3-coder:free'

function sendJson(response, status, body, origin = '*') {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'content-type, x-site-key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  })
  response.end(JSON.stringify(body))
}

async function readJson(path) {
  try {
    const content = await readFile(path, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    return {}
  }
}

async function writeJson(path, data) {
  const tempPath = `${path}.${randomBytes(8).toString('hex')}.tmp`
  try {
    await writeFile(tempPath, JSON.stringify(data, null, 2))
    await rename(tempPath, path)
  } catch (error) {
    console.error(`Failed to write JSON to ${path}:`, error)
    throw error
  }
}

async function readBody(request) {
  const chunks = []
  for await (const chunk of request) {
    chunks.push(chunk)
  }
  const body = Buffer.concat(chunks).toString('utf8')
  return body ? JSON.parse(body) : {}
}

function tokenize(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2)
}

function keywordSearch(chunks, query, topK) {
  const queryTokens = new Set(tokenize(query))

  return chunks
    .map((chunk) => {
      const chunkTokens = tokenize(`${chunk.title} ${chunk.content}`)
      const score = chunkTokens.reduce((sum, token) => sum + (queryTokens.has(token) ? 1 : 0), 0)
      return { ...chunk, score }
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}

async function getQueryEmbedding(query) {
  const response = await fetch('http://127.0.0.1:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: query,
    }),
  })

  if (!response.ok) {
    throw new Error(`Embedding query failed: ${response.statusText}`)
  }

  const data = await response.json()
  return data.embedding
}

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

async function retrieveChunks(chunks, query, topK) {
  if (!chunks.length) return []

  if (!chunks[0]?.vector) {
    return keywordSearch(chunks, query, topK)
  }

  let queryVector
  try {
    queryVector = await getQueryEmbedding(query)
  } catch (error) {
    console.warn(
      'Vector retrieval unavailable; falling back to keyword search:',
      error instanceof Error ? error.message : error,
    )
    return keywordSearch(chunks, query, topK)
  }

  return chunks
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryVector, chunk.vector),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}

function isOriginAllowed(site, origin) {
  if (!origin || origin === 'null') {
    return true
  }

  // Handle local development cases
  const cleanOrigin = origin.replace(/\/$/, '')
  return (
    site.allowedOrigins.includes('*') ||
    site.allowedOrigins.some((o) => o.replace(/\/$/, '') === cleanOrigin)
  )
}

function buildPrompt({ payload, chunks }) {
  const retrieved = chunks.length
    ? chunks
        .map(
          (chunk, index) =>
            `[${index + 1}] ${chunk.title}\nURL: ${chunk.url}\nContent: ${chunk.content}`,
        )
        .join('\n\n')
    : 'No relevant site knowledge was retrieved.'

  return [
    `Page title: ${payload.selection.title}`,
    `Page URL: ${payload.selection.url}`,
    `Selection type: ${payload.selection.kind}`,
    `Selection label: ${payload.selection.label}`,
    'Selected page context:',
    payload.selection.content,
    '',
    'Relevant site knowledge:',
    retrieved,
    '',
    `User request: ${payload.question}`,
  ].join('\n')
}

async function callOllama(model, prompt) {
  const response = await fetch(model.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model.model,
      stream: false,
      messages: [
        {
          role: 'system',
          content:
            'You are a contextual AI assistant embedded on a website. Use selected page context first, then relevant site knowledge. If the retrieved site knowledge is not enough, say what is missing.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status}`)
  }

  const data = await response.json()
  if (data.error) {
    throw new Error(data.error)
  }

  return data.message?.content?.trim() || 'No response returned.'
}

async function callOpenRouter(modelConfig, prompt) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is required for OpenRouter model routing')
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': OPENROUTER_REFERER,
      'X-Title': OPENROUTER_APP_TITLE,
    },
    body: JSON.stringify({
      model: modelConfig.model ?? DEFAULT_OPENROUTER_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a contextual AI assistant. Use the selected page context and provided site knowledge to answer accurately.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message ?? `OpenRouter returned ${response.status}`)
  }

  return data.choices?.[0]?.message?.content?.trim() || "I'm sorry, I couldn't generate a response."
}

async function callCustom(model, payload, chunks) {
  const response = await fetch(model.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(model.headers ?? {}),
    },
    body: JSON.stringify({
      ...payload,
      retrievedChunks: chunks,
    }),
  })

  if (!response.ok) {
    throw new Error(`Custom model endpoint returned ${response.status}`)
  }

  const data = await response.json()
  return data.answer ?? data.content ?? JSON.stringify(data, null, 2)
}

async function logQuery(entry) {
  await mkdir(dirname(LOG_PATH), { recursive: true })
  await appendFile(LOG_PATH, `${JSON.stringify({ ...entry, at: new Date().toISOString() })}\n`)
}

async function handleAsk(request, response, origin) {
  const sites = await readJson(SITES_PATH)
  const siteKey = request.headers['x-site-key']
  const site = sites[siteKey]

  if (!site) {
    sendJson(response, 401, { error: 'Invalid site key' }, origin)
    return
  }

  if (!isOriginAllowed(site, origin)) {
    sendJson(response, 403, { error: 'Origin is not allowed for this site key' }, origin)
    return
  }

  const payload = await readBody(request)
  if (!payload.question || !payload.selection) {
    sendJson(response, 400, { error: 'Expected question and selection' }, origin)
    return
  }

  const ragConfig = site.rag ?? { enabled: false, topK: 0 }
  const chunks = ragConfig.enabled
    ? await retrieveChunks(
        await readJson(resolve(ROOT, ragConfig.indexPath)),
        `${payload.question} ${payload.selection.content}`,
        ragConfig.topK ?? 4,
      )
    : []

  const prompt = buildPrompt({ payload, chunks })
  const answer =
    site.model.provider === 'custom'
      ? await callCustom(site.model, payload, chunks)
      : site.model.provider === 'ollama'
        ? await callOllama(site.model, prompt)
        : await callOpenRouter(site.model, prompt)

  await logQuery({
    siteId: site.siteId,
    question: payload.question,
    pageUrl: payload.selection.url,
    selectionKind: payload.selection.kind,
    retrievedChunkIds: chunks.map((chunk) => chunk.id),
  })

  sendJson(
    response,
    200,
    {
      answer,
      retrievedChunks: chunks.map(({ id, title, url, score }) => ({ id, title, url, score })),
    },
    origin,
  )
}

async function handleAdminSites(request, response, origin) {
  const sites = await readJson(SITES_PATH)

  if (request.method === 'GET') {
    sendJson(response, 200, sites, origin)
    return
  }

  if (request.method === 'POST') {
    const payload = await readBody(request)
    
    if (!payload.name) {
      sendJson(response, 400, { error: 'Site name is required' }, origin)
      return
    }

    const siteKey = `pk_${randomBytes(16).toString('hex')}`
    const newSite = {
      siteId: payload.siteId || payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: payload.name,
      allowedOrigins: Array.isArray(payload.allowedOrigins) ? payload.allowedOrigins : ['*'],
      model: payload.model || {
        provider: 'openrouter',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        model: DEFAULT_OPENROUTER_MODEL,
      },
      rag: payload.rag || {
        enabled: false,
        topK: 4,
        indexPath: './server/data/demo-docs.vectors.json',
      },
    }

    sites[siteKey] = newSite
    await writeJson(SITES_PATH, sites)
    sendJson(response, 201, { siteKey, ...newSite }, origin)
    return
  }

  if (request.method === 'PUT') {
    const urlParts = request.url.split('/')
    const siteKey = urlParts[urlParts.length - 1]

    if (!sites[siteKey]) {
      sendJson(response, 404, { error: 'Site not found' }, origin)
      return
    }

    const payload = await readBody(request)
    
    // Validate origins if provided
    if (payload.allowedOrigins && !Array.isArray(payload.allowedOrigins)) {
      sendJson(response, 400, { error: 'allowedOrigins must be an array' }, origin)
      return
    }

    sites[siteKey] = {
      ...sites[siteKey],
      ...payload,
    }

    await writeJson(SITES_PATH, sites)
    sendJson(response, 200, sites[siteKey], origin)
    return
  }

  sendJson(response, 405, { error: 'Method not allowed' }, origin)
}

async function handleAdminQueries(request, response, origin) {
  const url = new URL(request.url, `http://${request.headers.host}`)
  const siteKey = url.searchParams.get('siteKey')

  try {
    const content = await readFile(LOG_PATH, 'utf8')
    const lines = content.trim().split('\n').filter(Boolean)
    const logs = lines.map((line) => JSON.parse(line))

    if (siteKey) {
      const sites = await readJson(SITES_PATH)
      const siteId = sites[siteKey]?.siteId
      const filtered = logs.filter((log) => log.siteId === siteId)
      sendJson(response, 200, filtered, origin)
    } else {
      sendJson(response, 200, logs, origin)
    }
  } catch (error) {
    sendJson(response, 200, [], origin)
  }
}

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? 'shake-debug-token'

const server = createServer(async (request, response) => {
  const origin = request.headers.origin ?? '*'

  try {
    if (request.method === 'OPTIONS') {
      sendJson(response, 204, {}, origin)
      return
    }

    if (request.method === 'GET' && request.url === '/health') {
      sendJson(response, 200, { ok: true }, origin)
      return
    }

    if (request.method === 'POST' && request.url === '/v1/ask') {
      await handleAsk(request, response, origin)
      return
    }

    // Protect admin routes
    if (request.url.startsWith('/admin/')) {
      const authHeader = request.headers['authorization']
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader

      if (token !== ADMIN_TOKEN) {
        sendJson(response, 401, { error: 'Unauthorized: Invalid admin token' }, origin)
        return
      }

      if (request.url.startsWith('/admin/sites')) {
        await handleAdminSites(request, response, origin)
        return
      }

      if (request.url.startsWith('/admin/queries')) {
        await handleAdminQueries(request, response, origin)
        return
      }
    }

    sendJson(response, 404, { error: 'Not found' }, origin)
  } catch (error) {
    sendJson(response, 500, { error: error instanceof Error ? error.message : 'Unknown error' }, origin)
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Shake Cursor API listening on http://127.0.0.1:${PORT}`)
})
