import { debounce } from './utils'

type PointerSample = {
  x: number
  y: number
  time: number
}

export type ShakeDetectorOptions = {
  /** Callback when a shake gesture is detected */
  onShake: () => void
  
  /** Window of time to analyze gesture samples */
  windowMs?: number
  
  /** Cooldown after shake before detecting another */
  cooldownMs?: number
  
  /** Minimum pointer movement samples required */
  minSamples?: number
  
  /** Minimum direction reversals (zigzag pattern) */
  minReversals?: number
  
  /** Minimum total distance traveled during gesture */
  minDistance?: number
  
  /** Minimum horizontal velocity threshold to ignore scrolling */
  minDeltaX?: number
  
  /** Enable hysteresis to prevent accidental triggers */
  hysteresisEnabled?: boolean
  
  /** Previous shake timestamp for hysteresis check */
  lastShakeAt?: number
}

export function createShakeDetector(options: ShakeDetectorOptions) {
  const windowMs = options.windowMs ?? 650 // Adjusted from 750 to reduce sensitivity
  const cooldownMs = options.cooldownMs ?? 1200 // Increased cooldown to prevent spam
  const minSamples = options.minSamples ?? 8 // Increased from 7 for higher threshold
  const minReversals = options.minReversals ?? 4 // Reduced slightly but offset by increased samples
  const minDistance = options.minDistance ?? 360 // Increased from 340 for better specificity
  const minDeltaX = options.minDeltaX ?? 18 // Increased to reduce scroll interference
  const hysteresisEnabled = options.hysteresisEnabled ?? true
  let lastShakeAt = options.lastShakeAt ?? 0
  let samples: PointerSample[] = []

  // Use debounce to prevent rapid-fire triggers
  const checkForShake = debounce(() => {
    analyzeGesture()
  }, 5)

  /** Check if enough time has passed since last shake (hysteresis) */
  const isCooldownActive = () => {
    if (!hysteresisEnabled) return false
    const now = performance.now()
    return now - lastShakeAt < cooldownMs
  }

  const analyzeGesture = () => {
    const now = performance.now()

    // Skip if not enough samples or still in cooldown
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

      // Skip if movement is too vertical (likely scrolling)
      const isHorizontalMovement = Math.abs(dx) >= minDeltaX

      if (!isHorizontalMovement) {
        continue
      }

      // Detect direction reversal (zigzag pattern)
      const direction = Math.sign(dx)
      if (previousDirection !== 0 && direction !== previousDirection) {
        reversals += 1
      }
      previousDirection = direction

      // Track significant horizontal momentum
      if (Math.abs(dx) > minDeltaX * 2) {
        significantMomentum = true
      }
    }

    // Require both zigzag pattern AND significant horizontal movement
    const isValidShake = 
      reversals >= minReversals && 
      distance > minDistance &&
      significantMomentum

    if (isValidShake) {
      lastShakeAt = now
      samples = [] // Reset samples buffer
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
