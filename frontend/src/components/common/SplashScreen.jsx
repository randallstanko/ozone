import { useState, useEffect } from 'react'
import './SplashScreen.css'

const PHRASES = [
  {
    main: 'Tu segundo cerebro con inteligencia artificial.',
    sub: 'Recuerda todo lo que le contás, para siempre.'
  },
  {
    main: 'Sabe el contexto de cada conversacion que tuviste.',
    sub: 'No es un chatbot. Es alguien que te conoce de verdad.'
  },
  {
    main: 'Te ayuda a pensar y tomar mejores decisiones.',
    sub: 'Con toda tu historia disponible, cada respuesta es mas precisa.'
  },
  {
    main: 'Tu memoria perfecta, siempre disponible.',
    sub: 'Proyectos, metas, emociones, finanzas. Todo organizado y accesible.'
  },
  {
    main: 'Aprende de vos y se adapta con el tiempo.',
    sub: 'Cuanto mas le contas, mejor te acompana.'
  },
  {
    main: 'Pensa mejor con quien te conoce de verdad.',
    sub: 'Un asistente que recuerda tu historia completa y la usa para ayudarte.'
  },
  {
    main: 'Todo lo que compartas queda registrado con proposito.',
    sub: 'No almacena datos. Construye contexto para que puedas crecer.'
  },
]

const NEURONS = Array.from({ length: 22 })

export default function SplashScreen({ visible }) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [phraseIn, setPhraseIn] = useState(true)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setPhraseIn(false)
      setTimeout(() => {
        setPhraseIndex((i) => (i + 1) % PHRASES.length)
        setPhraseIn(true)
      }, 400)
    }, 2800)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={`splash-screen${!visible ? ' splash-hidden' : ''}`}>

      {/* Floating neurons background */}
      <div className="splash-neurons" aria-hidden>
        {NEURONS.map((_, i) => (
          <span key={i} className="neuron" style={{ '--i': i }} />
        ))}
      </div>

      {/* Subtle gradient overlay */}
      <div className="splash-glow-bg" aria-hidden />

      {/* Orbit rings */}
      <div className="splash-orbit-wrap" aria-hidden>
        <div className="orbit orbit-1" />
        <div className="orbit orbit-2" />
        <div className="orbit orbit-3" />
      </div>

      <div className="splash-center">
        <div className="splash-pulse-ring" aria-hidden />
        <div className="splash-pulse-ring splash-pulse-ring-2" aria-hidden />
        <h1 className="splash-title">OZONE</h1>
        <p className="splash-subtitle">inteligencia con memoria</p>
      </div>

      {/* Rotating phrases */}
      <div className={`splash-phrase-block${phraseIn ? ' phrase-in' : ' phrase-out'}`}>
        <p className="splash-phrase-main">{PHRASES[phraseIndex].main}</p>
        <p className="splash-phrase-sub">{PHRASES[phraseIndex].sub}</p>
      </div>

      {/* Progress dots */}
      <div className="splash-dots" aria-hidden>
        <span className="dot dot-1" />
        <span className="dot dot-2" />
        <span className="dot dot-3" />
      </div>

      {elapsed >= 8 && (
        <p className="splash-slow">
          {elapsed >= 18
            ? 'Ozone esta despertando, un momento mas...'
            : 'Casi listo...'}
        </p>
      )}
    </div>
  )
}
