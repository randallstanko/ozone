import { useEffect, useRef, useState, useCallback } from 'react'
import { X } from 'lucide-react'
import useChatStore from '../../store/chatStore'
import { transcribeAudio, ttsSpeak } from '../../services/api'
import './VoiceMode.css'

// --- Silence detection config ---
const SILENCE_THRESHOLD = 0.012  // RMS level considered silence
const SILENCE_DURATION_MS = 1400 // ms of silence before auto-stop
const MIN_RECORD_MS = 700        // minimum recording before checking silence

export default function VoiceMode({ onClose }) {
  // State machine: listening | thinking | speaking | error
  const [phase, setPhase] = useState('listening')
  const [statusText, setStatusText] = useState('Escuchando...')

  // Refs for stable async state
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const analyserRef = useRef(null)
  const silenceRAFRef = useRef(null)
  const recordStartRef = useRef(0)
  const loopActiveRef = useRef(true)
  const mountedRef = useRef(true)
  const currentAudioRef = useRef(null)   // HTMLAudioElement for TTS playback
  const audioCtxRef = useRef(null)       // for interrupt detection

  // ---- Safe state setters ----
  const safeSetPhase = (p) => { if (mountedRef.current) setPhase(p) }
  const safeSetStatus = (t) => { if (mountedRef.current) setStatusText(t) }

  // ---- Stop current TTS audio ----
  function stopAudio() {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.src = ''
      currentAudioRef.current = null
    }
  }

  // ---- Hard stop everything ----
  function hardStop() {
    loopActiveRef.current = false
    stopAudio()
    cancelAnimationFrame(silenceRAFRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop() } catch (_) {}
    }
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    mediaRecorderRef.current = null
    analyserRef.current = null
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close() } catch (_) {}
      audioCtxRef.current = null
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      hardStop()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- TTS via Groq (real audio) ----
  async function speakText(text) {
    if (!text?.trim() || !mountedRef.current || !loopActiveRef.current) return

    stopAudio() // stop any previous audio

    try {
      const audioBlob = await ttsSpeak(text)
      if (!mountedRef.current || !loopActiveRef.current) return

      const url = URL.createObjectURL(audioBlob)
      const audio = new Audio(url)
      currentAudioRef.current = audio

      return new Promise((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(url)
          currentAudioRef.current = null
          resolve()
        }
        audio.onerror = () => {
          URL.revokeObjectURL(url)
          currentAudioRef.current = null
          resolve()
        }
        audio.play().catch(() => resolve())
      })
    } catch (err) {
      console.error('[VoiceMode] TTS error:', err)
      // Fallback: skip speaking, keep loop alive
    }
  }

  // ---- Silence detection using Web Audio API ----
  function detectSilence(analyser, recorder) {
    const buffer = new Float32Array(analyser.fftSize)
    let silenceStart = null

    const check = () => {
      if (!mountedRef.current || !loopActiveRef.current) return
      if (recorder.state === 'inactive') return

      analyser.getFloatTimeDomainData(buffer)
      const rms = Math.sqrt(buffer.reduce((sum, v) => sum + v * v, 0) / buffer.length)
      const elapsed = Date.now() - recordStartRef.current

      if (rms < SILENCE_THRESHOLD) {
        if (!silenceStart) silenceStart = Date.now()
        else if (Date.now() - silenceStart >= SILENCE_DURATION_MS && elapsed >= MIN_RECORD_MS) {
          if (recorder.state !== 'inactive') recorder.stop()
          return
        }
      } else {
        silenceStart = null
      }

      silenceRAFRef.current = requestAnimationFrame(check)
    }

    silenceRAFRef.current = requestAnimationFrame(check)
  }

  // ---- Main loop: listen → transcribe → respond → speak → repeat ----
  const startListening = useCallback(async () => {
    if (!mountedRef.current || !loopActiveRef.current) return

    safeSetPhase('listening')
    safeSetStatus('Escuchando...')

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    } catch (err) {
      console.error('[VoiceMode] mic denied:', err)
      safeSetPhase('error')
      safeSetStatus('Sin acceso al micrófono')
      return
    }

    if (!mountedRef.current || !loopActiveRef.current) {
      stream.getTracks().forEach(t => t.stop())
      return
    }

    streamRef.current = stream

    // Web Audio analyser for silence detection
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    audioCtxRef.current = audioCtx
    const source = audioCtx.createMediaStreamSource(stream)
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 512
    source.connect(analyser)
    analyserRef.current = analyser

    // MediaRecorder
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ]
    const supportedMime = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || ''
    const recorder = new MediaRecorder(stream, supportedMime ? { mimeType: supportedMime } : {})
    mediaRecorderRef.current = recorder
    audioChunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data?.size > 0) audioChunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      try { audioCtx.close() } catch (_) {}
      cancelAnimationFrame(silenceRAFRef.current)

      if (!mountedRef.current || !loopActiveRef.current) return

      const mimeType = recorder.mimeType || supportedMime || 'audio/webm'
      const blob = new Blob(audioChunksRef.current, { type: mimeType })

      // Discard near-empty blobs
      if (blob.size < 2000) {
        startListening()
        return
      }

      // --- Transcribe ---
      safeSetPhase('thinking')
      safeSetStatus('Transcribiendo...')

      let userText = ''
      try {
        const { text } = await transcribeAudio(blob)
        userText = text?.trim() || ''
      } catch (err) {
        console.error('[VoiceMode] transcribe error:', err)
      }

      if (!mountedRef.current || !loopActiveRef.current) return

      if (!userText) {
        startListening()
        return
      }

      // --- Send to AI ---
      safeSetStatus('Pensando...')

      let aiText = ''
      try {
        const sendMsg = useChatStore.getState().sendMessage
        const result = await sendMsg(userText)
        aiText = result || ''
      } catch (err) {
        console.error('[VoiceMode] chat error:', err)
      }

      if (!mountedRef.current || !loopActiveRef.current) return

      // --- Speak response ---
      if (aiText) {
        safeSetPhase('speaking')
        safeSetStatus('Hablando...')
        await speakText(aiText)
      }

      if (!mountedRef.current || !loopActiveRef.current) return

      // --- Loop back ---
      startListening()
    }

    recorder.start(200)
    recordStartRef.current = Date.now()
    detectSilence(analyser, recorder)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-start listening on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mountedRef.current && loopActiveRef.current) {
        startListening()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [startListening])

  // ---- Interrupt: tap to stop AI speaking and re-listen ----
  const handleOrbClick = () => {
    if (phase === 'speaking') {
      // Interrupt TTS and start listening again
      stopAudio()
      if (mountedRef.current && loopActiveRef.current) {
        startListening()
      }
    } else if (phase === 'listening') {
      // Force-stop current recording early
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop() } catch (_) {}
      }
    }
    // thinking: no-op (let it finish)
  }

  const handleClose = useCallback(() => {
    hardStop()
    onClose()
  }, [onClose]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="voice-overlay" role="dialog" aria-modal="true" aria-label="Modo voz">
      {/* Close button */}
      <button
        className="voice-close-btn"
        onClick={handleClose}
        aria-label="Cerrar modo voz"
      >
        <X size={22} />
      </button>

      {/* Center section */}
      <div className="voice-center">
        {/* Orb */}
        <button
          className={`voice-orb voice-orb--${phase}`}
          onClick={handleOrbClick}
          aria-label={phase === 'speaking' ? 'Interrumpir' : 'Continuar'}
        >
          <div className="voice-orb-inner" />

          {/* Ripple rings when listening or speaking */}
          {(phase === 'listening' || phase === 'speaking') && (
            <>
              <div className="voice-ring voice-ring--1" />
              <div className="voice-ring voice-ring--2" />
              <div className="voice-ring voice-ring--3" />
            </>
          )}

          {/* Thinking dots */}
          {phase === 'thinking' && (
            <div className="voice-thinking-dots">
              {[0, 1, 2].map(i => (
                <div key={i} className="voice-dot" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          )}
        </button>

        <p className="voice-status">{statusText}</p>

        <p className="voice-hint">
          {phase === 'listening'
            ? 'El silencio se detecta automáticamente'
            : phase === 'thinking'
            ? 'Procesando tu mensaje...'
            : phase === 'speaking'
            ? 'Toca para interrumpir'
            : phase === 'error'
            ? 'Error de micrófono'
            : ''}
        </p>
      </div>
    </div>
  )
}
