import { useState, useEffect } from 'react'
import './SplashScreen.css'

const PHRASES = [
  {
    main: 'Estoy recordando todo lo que alguna vez me dijiste.',
    sub: 'Cada conversación, cada idea, cada decisión que tomaste. Todo está acá.'
  },
  {
    main: 'Tu segundo cerebro está despertando.',
    sub: 'Ozone recuerda lo que vos olvidás. Tus metas, tus problemas, tus avances.'
  },
  {
    main: 'No soy un chatbot. Soy tu conciencia digital.',
    sub: 'Hablame de lo que sea: finanzas, relaciones, proyectos, emociones, estudio, salud.'
  },
  {
    main: 'Conozco tu historia completa.',
    sub: 'Uso todo lo que me contaste para ayudarte a pensar mejor y tomar mejores decisiones.'
  },
  {
    main: 'Soy tu agenda viva.',
    sub: 'No solo guardo información. Conecto tus ideas, detecto patrones y te recuerdo lo importante.'
  },
  {
    main: 'Todo lo que me digas queda para siempre.',
    sub: 'Tu memoria no tiene límite. Mientras más me cuentes, mejor te puedo acompañar.'
  },
  {
    main: 'Preparando el contexto de toda tu vida.',
    sub: 'Revisando tus emociones, proyectos, finanzas, relaciones, metas y aprendizajes.'
  },
]

const NEURONS = Array.from({ length: 22 })

export default function SplashScreen({ visible }) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [phraseIn, setPhraseIn] = useState(true)
  const [elapsed, setElapsed] = useState(0)

  // Rotate phrases every 4s with fade transition
  useEffect(() => {
    const id = setInterval(() => {
      setPhraseIn(false)
      setTimeout(() => {
        setPhraseIndex((i) => (i + 1) % PHRASES.length)
        setPhraseIn(true)
      }, 500)
    }, 7000)
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
        <p className="splash-subtitle">tu segundo cerebro</p>
      </div>

      {/* === Rotating phrases === */}
      <div className={`splash-phrase-block${phraseIn ? ' phrase-in' : ' phrase-out'}`}>
        <p className="splash-phrase-main">{PHRASES[phraseIndex].main}</p>
        <p className="splash-phrase-sub">{PHRASES[phraseIndex].sub}</p>
      </div>

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
            : 'Casi listo...'}
        </p>
      )}
    </div>
  )
}
