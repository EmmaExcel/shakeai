import { debounce } from './utils'

type PointerSample = {
  x: number
  y: number
  time: number
}

export type ShakeDetectorOptions = {
  onShake: () => void
  
  windowMs?: number
  
  cooldownMs?: number
  
  minSamples?: number
  
  minReversals?: number
  
  minDistance?: number
  
  minDeltaX?: number
  
  hysteresisEnabled?: boolean
  
  lastShakeAt?: number
}

export function createShakeDetector(options: ShakeDetectorOptions) {
  const windowMs = options.windowMs ?? 650
  const cooldownMs = options.cooldownMs ?? 1200
  const minSamples = options.minSamples ?? 8
  const minReversals = options.minReversals ?? 4
  const minDistance = options.minDistance ?? 360
  const minDeltaX = options.minDeltaX ?? 18
  const hysteresisEnabled = options.hysteresisEnabled ?? true
  let lastShakeAt = options.lastShakeAt ?? 0
  let samples: PointerSample[] = []

  const checkForShake = debounce(() => {
    analyzeGesture()
  }, 5)

  const isCooldownActive = () => {
    if (!hysteresisEnabled) return false
    const now = performance.now()
    return now - lastShakeAt < cooldownMs
  }

  const analyzeGesture = () => {
    const now = performance.now()

    if (samples.length < minSamples || isCooldownActive()) {
      return
    }

    let reversals = 0
    let distance = 0
    let previousDirection = 0
    let significantMomentum = false

    for (let index = 1; index < samples.length; index += 1) {
      const dx = samples[index].x - samples[index - 1].x
      const dy = samples[index].y - samples[index - 1].y
      distance += Math.hypot(dx, dy)

      const isHorizontalMovement = Math.abs(dx) >= minDeltaX

      if (!isHorizontalMovement) {
        continue
      }

      const direction = Math.sign(dx)
      if (previousDirection !== 0 && direction !== previousDirection) {
        reversals += 1
      }
      previousDirection = direction

      if (Math.abs(dx) > minDeltaX * 2) {
        significantMomentum = true
      }
    }

    const isValidShake = 
      reversals >= minReversals && 
      distance > minDistance &&
      significantMomentum

    if (isValidShake) {
      lastShakeAt = now
      samples = []
      options.onShake()
    }
  }

  const onPointerMove = (event: PointerEvent) => {
    const now = performance.now()
    samples.push({ x: event.clientX, y: event.clientY, time: now })
    samples = samples.filter((sample) => now - sample.time < windowMs)
    checkForShake()
  }

  document.addEventListener('pointermove', onPointerMove, { passive: true })

  return () => {
    document.removeEventListener('pointermove', onPointerMove)
  }
}
