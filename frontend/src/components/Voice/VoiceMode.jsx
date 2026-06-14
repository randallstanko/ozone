import { useEffect, useRef, useState, useCallback } from 'react'
import { X, MicOff } from 'lucide-react'
import useChatStore from '../../store/chatStore'
import { transcribeAudio } from '../../services/api'
import './VoiceMode.css'

// --- Silence detection config ---
const SILENCE_THRESHOLD = 0.015  // RMS level considered silence
const SILENCE_DURATION_MS = 1500 // ms of silence before auto-stop
const MIN_RECORD_MS = 800        // minimum recording before checking silence

export default function VoiceMode({ onClose }) {
  // State machine: idle | listening | thinking | speaking | error
  const [phase, setPhase] = useState('idle')
  const [statusText, setStatusText] = useState('Toca para hablar')
  const [muted, setMuted] = useState(false)

  // Refs to keep stable across renders
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const analyserRef = useRef(null)
  const silenceRAFRef = useRef(null)
  const recordStartRef = useRef(0)
  const loopActiveRef = useRef(false)
  const mutedRef = useRef(false)
  const mountedRef = useRef(true)
  const phaseRef = useRef('idle')

  // Keep refs in sync
  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { mutedRef.current = muted }, [muted])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      hardStop()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Safe state setters ----
  const safeSetPhase = (p) => { if (mountedRef.current) setPhase(p) }
  const safeSetStatus = (t) => { if (mountedRef.current) setStatusText(t) }

  // ---- Hard stop everything ----
  function hardStop() {
    loopActiveRef.current = false
    window.speechSynthesis?.cancel()
    cancelAnimationFrame(silenceRAFRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop() } catch (_) {}
    }
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    mediaRecorderRef.current = null
    analyserRef.current = null
  }

  // ---- TTS via Web Speech API ----
  function speakText(text) {
    return new Promise((resolve) => {
      if (!text?.trim() || mutedRef.current) { resolve(); return }

      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)

      // Best voice selection: prefer natural Spanish voices
      const voices = window.speechSynthesis.getVoices()
      const esVoice = voices.find(v => v.lang.startsWith('es') && v.localService)
        || voices.find(v => v.lang.startsWith('es'))
        || voices.find(v => v.lang.startsWith('en'))
        || voices[0]
      if (esVoice) utterance.voice = esVoice
      utterance.rate = 1.05
      utterance.pitch = 1.0
      utterance.volume = 1.0

      let resolved = false
      const done = () => { if (!resolved) { resolved = true; resolve() } }
      utterance.onend = done
      utterance.onerror = done

      // iOS Safari workaround: can get stuck; safety timeout
      const safety = setTimeout(done, 60000)
      utterance.onend = () => { clearTimeout(safety); done() }
      utterance.onerror = () => { clearTimeout(safety); done() }

      window.speechSynthesis.speak(utterance)
    })
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

  // ---- Main listen → transcribe → respond → speak loop ----
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

    // Web Audio API analyser
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
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
      audioCtx.close()
      cancelAnimationFrame(silenceRAFRef.current)

      if (!mountedRef.current || !loopActiveRef.current) return

      const mimeType = recorder.mimeType || supportedMime || 'audio/webm'
      const blob = new Blob(audioChunksRef.current, { type: mimeType })

      // Discard near-empty blobs (user didn't really speak)
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
        // Nothing heard, loop back
        startListening()
        return
      }

      // --- Send to chat + get AI response ---
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

  // ---- Controls ----
  const startLoop = useCallback(() => {
    loopActiveRef.current = true
    startListening()
  }, [startListening])

  const pauseLoop = useCallback(() => {
    window.speechSynthesis?.cancel()
    cancelAnimationFrame(silenceRAFRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop() } catch (_) {}
    }
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    loopActiveRef.current = false
    safeSetPhase('idle')
    safeSetStatus('Toca para hablar')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => {
    hardStop()
    onClose()
  }, [onClose]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev
      mutedRef.current = next
      if (next) window.speechSynthesis?.cancel()
      return next
    })
  }, [])

  const handleOrbClick = () => {
    if (phase === 'idle') startLoop()
    else pauseLoop()
  }

  return (
    <div className="voice-overlay" role="dialog" aria-modal="true" aria-label="Modo voz">
      {/* Top bar */}
      <div className="voice-top-bar">
        <span className="voice-label">Modo Voz</span>
        <div className="voice-top-actions">
          <button
            className={`voice-btn-icon${muted ? ' voice-btn-icon--active' : ''}`}
            onClick={toggleMute}
            aria-label={muted ? 'Activar sonido' : 'Silenciar TTS'}
            title={muted ? 'Activar sonido' : 'Silenciar TTS'}
          >
            <MicOff size={18} />
          </button>
          <button
            className="voice-btn-icon"
            onClick={handleClose}
            aria-label="Cerrar modo voz"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Center orb */}
      <div className="voice-center">
        <button
          className={`voice-orb voice-orb--${phase}`}
          onClick={handleOrbClick}
          aria-label={phase === 'idle' ? 'Iniciar conversación por voz' : 'Pausar'}
        >
          <div className="voice-orb-inner" />

          {/* Ripple rings when active */}
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

        {phase !== 'idle' && (
          <button className="voice-stop-btn" onClick={pauseLoop}>
            Pausar
          </button>
        )}
      </div>

      {/* Bottom hint */}
      <p className="voice-hint">
        {phase === 'idle'
          ? 'Toca el orbe para iniciar la conversación'
          : phase === 'listening'
          ? 'Habla... el silencio se detecta automáticamente'
          : phase === 'thinking'
          ? 'Procesando tu mensaje...'
          : phase === 'speaking'
          ? 'Ozone está respondiendo'
          : ''}
      </p>
    </div>
  )
}
