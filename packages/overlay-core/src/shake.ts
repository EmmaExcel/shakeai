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
}

export function createShakeDetector(options: ShakeDetectorOptions) {
  const windowMs = options.windowMs ?? 650
  const cooldownMs = options.cooldownMs ?? 1000
  const minSamples = options.minSamples ?? 7
  const minReversals = options.minReversals ?? 5
  const minDistance = options.minDistance ?? 340
  const minDeltaX = options.minDeltaX ?? 16
  let samples: PointerSample[] = []
  let lastShakeAt = 0

  const onPointerMove = (event: PointerEvent) => {
    const now = performance.now()
    samples.push({ x: event.clientX, y: event.clientY, time: now })
    samples = samples.filter((sample) => now - sample.time < windowMs)

    if (samples.length < minSamples || now - lastShakeAt < cooldownMs) {
      return
    }

    let reversals = 0
    let distance = 0
    let previousDirection = 0

    for (let index = 1; index < samples.length; index += 1) {
      const dx = samples[index].x - samples[index - 1].x
      const dy = samples[index].y - samples[index - 1].y
      distance += Math.hypot(dx, dy)

      if (Math.abs(dx) < minDeltaX) {
        continue
      }

      const direction = Math.sign(dx)
      if (previousDirection !== 0 && direction !== previousDirection) {
        reversals += 1
      }
      previousDirection = direction
    }

    if (reversals >= minReversals && distance > minDistance) {
      lastShakeAt = now
      samples = []
      options.onShake()
    }
  }

  document.addEventListener('pointermove', onPointerMove)

  return () => {
    document.removeEventListener('pointermove', onPointerMove)
  }
}
