import { useState, useEffect } from 'react'
import './SplashScreen.css'

const PHRASES = [
  'Recordando todo lo que me contaste...',
  'Revisando tus metas, ideas y decisiones...',
  'Preparando el contexto de toda tu vida...',
  'Conectando con tu segundo cerebro...',
  'Chequeando tus emociones, proyectos y finanzas...',
  'Tu conciencia digital está despertando...',
  'Ozone recuerda todo. Siempre.',
]

const NEURONS = Array.from({ length: 22 })

export default function SplashScreen({ visible }) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [phraseIn, setPhraseIn] = useState(true)
  const [elapsed, setElapsed] = useState(0)

  // Rotate phrases every 3.5s with fade transition
  useEffect(() => {
    const id = setInterval(() => {
      setPhraseIn(false)
      setTimeout(() => {
        setPhraseIndex((i) => (i + 1) % PHRASES.length)
        setPhraseIn(true)
      }, 480)
    }, 3500)
    return () => clearInterval(id)
  }, [])

  // Track elapsed seconds for slow-backend message
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={`splash-screen${!visible ? ' splash-hidden' : ''}`}>

      {/* === Floating neurons background === */}
      <div className="splash-neurons" aria-hidden>
        {NEURONS.map((_, i) => (
          <span key={i} className="neuron" style={{ '--i': i }} />
        ))}
      </div>

      {/* === Radial glow overlay === */}
      <div className="splash-glow-bg" aria-hidden />

      {/* === Orbit rings + title === */}
      <div className="splash-orbit-wrap" aria-hidden>
        <div className="orbit orbit-1" />
        <div className="orbit orbit-2" />
        <div className="orbit orbit-3" />
      </div>

      <div className="splash-center">
        {/* Pulse ring behind title */}
        <div className="splash-pulse-ring" aria-hidden />
        <div className="splash-pulse-ring splash-pulse-ring-2" aria-hidden />
        <h1 className="splash-title">OZONE</h1>
        <p className="splash-subtitle">segundo cerebro</p>
      </div>

      {/* === Rotating phrase === */}
      <p className={`splash-phrase${phraseIn ? ' phrase-in' : ' phrase-out'}`}>
        {PHRASES[phraseIndex]}
      </p>

      {/* === Progress dots === */}
      <div className="splash-dots" aria-hidden>
        <span className="dot dot-1" />
        <span className="dot dot-2" />
        <span className="dot dot-3" />
      </div>

      {/* === Slow-backend message === */}
      {elapsed >= 30 && (
        <p className="splash-slow">
          {elapsed >= 60
            ? 'Ozone está despertando, un momento más...'
            : 'El servidor está iniciando, casi listo...'}
        </p>
      )}
    </div>
  )
}
