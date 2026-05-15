import type { AIOverlayAskPayload, AIOverlayModelConfig } from './types'

const DEFAULT_OLLAMA_ENDPOINT = 'http://localhost:11434/api/chat'
const DEFAULT_MODEL = 'qwen3-coder:480b-cloud'
const DEFAULT_API_BASE_URL = 'https://shakeai.onrender.com'

type OllamaResponse = {
  message?: {
    content?: string
  }
  error?: string
}

export async function askModel(config: AIOverlayModelConfig, payload: AIOverlayAskPayload) {
  const provider = config.provider ?? 'ollama'
  const endpoint = config.endpoint ?? DEFAULT_OLLAMA_ENDPOINT
  const model = config.model ?? DEFAULT_MODEL

  if (provider === 'custom') {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Custom endpoint returned ${response.status}`)
    }

    const data: unknown = await response.json()
    if (typeof data === 'string') {
      return data
    }

    if (data && typeof data === 'object' && 'answer' in data && typeof data.answer === 'string') {
      return data.answer
    }

    if (data && typeof data === 'object' && 'content' in data && typeof data.content === 'string') {
      return data.content
    }

    return JSON.stringify(data, null, 2)
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        {
          role: 'system',
          content:
            'You are an in-page AI assistant. Use the selected website context to answer or transform content. Be direct and practical.',
        },
        {
          role: 'user',
          content: [
            `Page title: ${payload.selection.title}`,
            `Page URL: ${payload.selection.url}`,
            `Selection type: ${payload.selection.kind}`,
            `Selection label: ${payload.selection.label}`,
            'Selected context:',
            payload.selection.content,
            '',
            `User request: ${payload.question}`,
          ].join('\n'),
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status}`)
  }

  const data: OllamaResponse = await response.json()
  if (data.error) {
    throw new Error(data.error)
  }

  return data.message?.content?.trim() || 'No response returned.'
}

export async function askHostedApi(options: {
  apiBaseUrl?: string
  siteKey: string
  payload: AIOverlayAskPayload
}) {
  const response = await fetch(`${options.apiBaseUrl ?? DEFAULT_API_BASE_URL}/v1/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-site-key': options.siteKey,
    },
    body: JSON.stringify(options.payload),
  })

  const data: { answer?: string; error?: string } = await response.json()

  if (!response.ok || data.error) {
    throw new Error(data.error ?? `Hosted API returned ${response.status}`)
  }

  return data.answer ?? 'No response returned.'
}
