import type { AIOverlayAskPayload, AIOverlayEditResult, AIOverlayModelConfig } from './types'

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
    const isOpenAI = endpoint.includes('/chat/completions') || endpoint.includes('/v1/chat')
    let requestBody: any
    if (isOpenAI) {
      requestBody = {
        model: config.model || model,
        messages: [
          {
            role: 'system',
            content: 'You are an in-page AI assistant. Use the selected website context to answer or transform content. Be direct and practical.',
          },
          {
            role: 'user',
            content: buildUserMessage(payload),
          },
        ],
      }
    } else {
      requestBody = payload
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`Custom endpoint returned ${response.status}`)
    }

    const data: any = await response.json()
    if (typeof data === 'string') {
      return data
    }

    if (data && typeof data === 'object' && data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content.trim()
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

export async function askVision(
  config: AIOverlayModelConfig,
  payload: AIOverlayAskPayload
): Promise<string> {
  const visionModel = config.visionModel ?? 'gpt-4o'
  const endpoint = config.endpoint ?? DEFAULT_OLLAMA_ENDPOINT
  
  let effectiveEndpoint = endpoint
  let effectiveModel = visionModel

  if (config.provider === 'custom') {
    effectiveEndpoint = config.endpoint ?? endpoint
    effectiveModel = config.model ?? visionModel
  } else if (config.provider === 'ollama') {
    const ollamaVisionModels = ['llava', 'bakLLaVA', 'moondream']
    if (!effectiveModel || ollamaVisionModels.includes(effectiveModel.toLowerCase())) {
      effectiveEndpoint = config.endpoint ?? DEFAULT_OLLAMA_ENDPOINT
      effectiveModel = effectiveModel ?? ollamaVisionModels[0]
    }
  } else if (config.provider === 'openrouter') {
    const openrouterVisionModels = ['gpt-4o', 'claude-3-opus', 'claude-3-sonnet']
    effectiveModel = effectiveModel ?? openrouterVisionModels[0]
  }

  console.log(`Using vision model: ${effectiveModel} at ${effectiveEndpoint}`)

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
              `Image Analysis Request`,
              `Alt text: ${payload.selection.alt}`,
              `Source: ${payload.selection.source}`,
              `Dimensions: ${payload.selection.width?.toFixed(0)}x${payload.selection.height?.toFixed(0)}`,
              '',
              
              payload.selection.data && payload.selection.mimeType
                ? `Image Data (Base64):`
                : 'Visual context provided',
              payload.selection.data,
              
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

  const isOpenAI = (config.provider === 'custom' && (effectiveEndpoint.includes('/chat/completions') || effectiveEndpoint.includes('/v1/chat')))

  if (isOpenAI) {
    let base64Url = ''
    if (payload.selection.data) {
      if (payload.selection.data.startsWith('data:')) {
        base64Url = payload.selection.data
      } else {
        const mime = payload.selection.mimeType || 'image/png'
        base64Url = `data:${mime};base64,${payload.selection.data}`
      }
    }

    const promptText = [
      `Image Analysis Request`,
      payload.question ? `Question: ${payload.question}` : '',
      `Page title: ${payload.selection.title}`,
      `Page URL: ${payload.selection.url}`,
    ].filter(Boolean).join('\n')

    const response = await fetch(effectiveEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers || {}),
      },
      body: JSON.stringify({
        model: effectiveModel,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: promptText,
              },
              base64Url ? {
                type: 'image_url',
                image_url: {
                  url: base64Url,
                },
              } : null,
            ].filter(Boolean),
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI Vision API returned ${response.status}`)
    }

    const data = await response.json() as any
    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content.trim()
    }
    throw new Error('OpenAI Vision model returned unexpected format')
  }

  const formData = new FormData()
  formData.append('model', effectiveModel)
  
  if (payload.selection.data && payload.selection.mimeType) {
    const base64Data = payload.selection.data
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
  
  if (data.text) return data.text
  if (data.completion) return data.completion
  if (data.choices?.[0]?.message?.content) return data.choices[0].message.content
  if (data.result) return JSON.stringify(data.result, null, 2)

  throw new Error('Vision model returned unexpected format')
}

function extractMimeType(header: string): string {
  const parts = header.split(';')
  return parts[0].split('/')[1] || 'jpeg'
}

export async function askEdit(
  config: AIOverlayModelConfig,
  elementContext: {
    selector: string
    tagName: string
    classes: string
    computedStyles: Record<string, string>
    innerTextSnippet: string
  },
  userRequest: string
): Promise<AIOverlayEditResult> {
  const endpoint = config.endpoint ?? DEFAULT_OLLAMA_ENDPOINT
  const model = config.model ?? DEFAULT_MODEL
  const isOpenAI = endpoint.includes('/chat/completions') || endpoint.includes('/v1/chat')

  const systemPrompt = `You are a CSS expert and web design assistant integrated into a browser AI overlay.
Your job is to translate natural language style requests into valid CSS property changes.

You MUST respond with ONLY a single valid JSON object in this exact format (no markdown, no explanation):
{
  "selector": "<the CSS selector provided>",
  "css": {
    "property-name": "value",
    "another-property": "value"
  },
  "description": "<one sentence describing what changed>"
}

Rules:
- Only include CSS properties that need to change
- Use standard CSS property names (kebab-case)
- Use valid CSS values only
- Keep changes minimal and precise
- Do NOT include !important in values (the SDK adds it)
- Do NOT wrap in markdown code blocks`

  const userPrompt = `Element details:
- Selector: ${elementContext.selector}
- Tag: ${elementContext.tagName}
- Classes: ${elementContext.classes || 'none'}
- Text snippet: "${elementContext.innerTextSnippet}"

Current computed styles:
${Object.entries(elementContext.computedStyles)
  .map(([k, v]) => `  ${k}: ${v}`)
  .join('\n')}

User request: "${userRequest}"

Respond with the JSON edit object only.`

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]

  let rawText: string

  if (isOpenAI || config.provider === 'custom') {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(config.headers ?? {}) },
      body: JSON.stringify({ model, messages }),
    })
    if (!response.ok) throw new Error(`Edit model returned ${response.status}`)
    const data: any = await response.json()
    rawText = data.choices?.[0]?.message?.content ?? ''
  } else {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(config.headers ?? {}) },
      body: JSON.stringify({ model, stream: false, messages }),
    })
    if (!response.ok) throw new Error(`Edit model returned ${response.status}`)
    const data: OllamaResponse = await response.json()
    rawText = data.message?.content ?? ''
  }

  rawText = rawText.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim()

  try {
    const parsed: AIOverlayEditResult = JSON.parse(rawText)
    if (!parsed.selector || !parsed.css || typeof parsed.css !== 'object') {
      throw new Error('Invalid edit result shape')
    }
    return parsed
  } catch {
    throw new Error(`AI returned invalid edit JSON: ${rawText.slice(0, 200)}`)
  }
}
