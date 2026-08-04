'use client'
import confetti from 'canvas-confetti'

const GOLD_COLORS = ['#f5c518', '#ffdd77', '#b8860b', '#ffffff']

export function celebrate(opts = {}) {
  confetti({
    particleCount: 90,
    spread: 70,
    startVelocity: 35,
    origin: { y: 0.6 },
    colors: GOLD_COLORS,
    ...opts,
  })
}

export function celebrateBig() {
  const end = Date.now() + 700
  const fire = () => {
    confetti({ particleCount: 3, angle: 60, spread: 60, origin: { x: 0 }, colors: GOLD_COLORS })
    confetti({ particleCount: 3, angle: 120, spread: 60, origin: { x: 1 }, colors: GOLD_COLORS })
    if (Date.now() < end) requestAnimationFrame(fire)
  }
  fire()
}
