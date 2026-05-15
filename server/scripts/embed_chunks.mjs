import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const INPUT_PATH = resolve(__dirname, '../data/demo-docs.chunks.json')
const OUTPUT_PATH = resolve(__dirname, '../data/demo-docs.vectors.json')
const OLLAMA_ENDPOINT = 'http://127.0.0.1:11434/api/embeddings'
const MODEL = 'nomic-embed-text'

async function getEmbedding(text) {
  const response = await fetch(OLLAMA_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt: text,
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama embedding failed: ${response.statusText}`)
  }

  const data = await response.json()
  return data.embedding
}

async function main() {
  const chunks = JSON.parse(await readFile(INPUT_PATH, 'utf8'))
  const vectorizedChunks = []

  console.log(`Generating embeddings for ${chunks.length} chunks...`)

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    try {
      const embedding = await getEmbedding(chunk.content)
      vectorizedChunks.push({
        ...chunk,
        vector: embedding
      })
      if ((i + 1) % 5 === 0) {
        console.log(`Progress: ${i + 1}/${chunks.length}`)
      }
    } catch (error) {
      console.error(`Error embedding chunk ${chunk.id}:`, error.message)
    }
  }

  await writeFile(OUTPUT_PATH, JSON.stringify(vectorizedChunks, null, 2))
  console.log(`Saved ${vectorizedChunks.length} vectorized chunks to ${OUTPUT_PATH}`)
}

main().catch(console.error)
