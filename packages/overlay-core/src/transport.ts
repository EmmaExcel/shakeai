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

/**
 * Ask a standard text-based model (Ollama, OpenRouter, custom)
 */
export async function askModel(config: AIOverlayModelConfig, payload: AIOverlayAskPayload) {
  const provider = config.provider ?? 'ollama'
  const endpoint = config.endpoint ?? DEFAULT_OLLAMA_ENDPOINT
  const model = config.model ?? DEFAULT_MODEL

  // Custom endpoint handling
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

  // Ollama API call
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
          content: buildUserMessage(payload),
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

/**
 * Build the user message content for standard models
 */
function buildUserMessage(payload: AIOverlayAskPayload): string {
  return [
    `Page title: ${payload.selection.title}`,
    `Page URL: ${payload.selection.url}`,
    `Selection type: ${payload.selection.kind}`,
    `Selection label: ${payload.selection.label}`,
    'Selected context:',
    payload.selection.content,
    '',
    `User request: ${payload.question}`,
  ].join('\n')
}

/**
 * Ask a hosted AI API service
 */
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

/**
 * Ask a vision-enabled model for image analysis
 * Supports GPT-4o, Claude 3 Vision, LLaVA, and other vision models
 */
export async function askVision(
  config: AIOverlayModelConfig,
  payload: AIOverlayAskPayload
): Promise<string> {
  const visionModel = config.visionModel ?? 'gpt-4o'
  const endpoint = config.endpoint ?? DEFAULT_OLLAMA_ENDPOINT
  
  // Try multiple vision models based on provider
  let effectiveEndpoint = endpoint
  let effectiveModel = visionModel

  if (config.provider === 'custom') {
    effectiveEndpoint = config.endpoint ?? endpoint
    effectiveModel = config.model ?? visionModel
  } else if (config.provider === 'ollama') {
    // Ollama-compatible vision models
    const ollamaVisionModels = ['llava', 'bakLLaVA', 'moondream']
    if (!effectiveModel || ollamaVisionModels.includes(effectiveModel.toLowerCase())) {
      effectiveEndpoint = config.endpoint ?? DEFAULT_OLLAMA_ENDPOINT
      effectiveModel = effectiveModel ?? ollamaVisionModels[0]
    }
  } else if (config.provider === 'openrouter') {
    // OpenRouter vision models
    const openrouterVisionModels = ['gpt-4o', 'claude-3-opus', 'claude-3-sonnet']
    effectiveModel = effectiveModel ?? openrouterVisionModels[0]
  }

  console.log(`Using vision model: ${effectiveModel} at ${effectiveEndpoint}`)

  // For Ollama/LLaVA-style models, send multi-modal message format
  if (config.provider === 'ollama') {
    const response = await fetch(effectiveEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers || {}),
      },
      body: JSON.stringify({
        model: effectiveModel,
        stream: false,
        messages: [
          {
            role: 'user',
            content: [
              // Vision context
              `Image Analysis Request`,
              `Alt text: ${payload.selection.alt}`,
              `Source: ${payload.selection.source}`,
              `Dimensions: ${payload.selection.width?.toFixed(0)}x${payload.selection.height?.toFixed(0)}`,
              '',
              
              // Base64 image data if available
              payload.selection.data && payload.selection.mimeType
                ? `Image Data (Base64):`
                : 'Visual context provided',
              payload.selection.data,
              
              // User question
              '',
              `Your task: ${payload.question}`,
            ].filter(Boolean),
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`Vision model returned ${response.status}`)
    }

    const data: OllamaResponse = await response.json()
    if (data.error) {
      throw new Error(data.error)
    }

    return data.message?.content?.trim() || 'No response returned.'
  }

  // For REST APIs that support images (GPT, Claude, etc.)
  const formData = new FormData()
  formData.append('model', effectiveModel)
  
  if (payload.selection.data && payload.selection.mimeType) {
    const base64Data = payload.selection.data
    // Convert base64 to Blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {type: payload.selection.mimeType});
    
    formData.append('image', blob, `image.${extractMimeType(payload.selection.mimeType)}`)
  }

  if (payload.question) {
    formData.append('prompt', payload.question)
  } else {
    formData.append('prompt', 'Please analyze this image and describe what you see.')
  }

  const response = await fetch(config.endpoint ?? effectiveEndpoint, {
    method: 'POST',
    headers: {
      ...(config.headers || {}),
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Vision API returned ${response.status}`)
  }

  const data = await response.json() as any
  
  // Handle different API response formats
  if (data.text) return data.text
  if (data.completion) return data.completion
  if (data.choices?.[0]?.message?.content) return data.choices[0].message.content
  if (data.result) return JSON.stringify(data.result, null, 2)

  throw new Error('Vision model returned unexpected format')
}

/**
 * Extract MIME type from header string
 */
function extractMimeType(header: string): string {
  const parts = header.split(';')
  return parts[0].split('/')[1] || 'jpeg'
}
