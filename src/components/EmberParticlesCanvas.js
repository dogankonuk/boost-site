'use client'

import Particles, { ParticlesProvider } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'

const PARTICLE_OPTIONS = {
  fullScreen: { enable: false },
  background: { color: 'transparent' },
  fpsLimit: 45,
  particles: {
    number: { value: 28, density: { enable: true, area: 900 } },
    color: { value: ['#f5c518', '#ffdd77', '#b8860b'] },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.1, max: 0.55 },
      animation: { enable: true, speed: 0.6, sync: false, startValue: 'random' },
    },
    size: { value: { min: 1, max: 3 } },
    move: {
      enable: true,
      speed: { min: 0.3, max: 1 },
      direction: 'top',
      random: true,
      straight: false,
      outModes: { default: 'out' },
    },
    links: { enable: false },
  },
  interactivity: { events: { onHover: { enable: false }, onClick: { enable: false } } },
  detectRetina: true,
}

export default function EmberParticlesCanvas() {
  return (
    <ParticlesProvider init={loadSlim}>
      <Particles
        id="ember-particles"
        options={PARTICLE_OPTIONS}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      />
    </ParticlesProvider>
  )
}
