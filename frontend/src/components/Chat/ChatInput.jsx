import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowUp, Mic, Square } from 'lucide-react'
import useChatStore from '../../store/chatStore'
import { transcribeAudio } from '../../services/api'

// Formatea segundos como MM:SS
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const MAX_DURATION_SECONDS = 300 // 5 minutos

export default function ChatInput() {
  const [input, setInput] = useState('')
  const { sendMessage, isSending, activeFolder } = useChatStore()
  const textareaRef = useRef(null)

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 140) + 'px'
    }
  }, [input])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || isSending || !activeFolder) return
    sendMessage(input.trim())
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    clearInterval(timerRef.current)
    setIsRecording(false)
    setRecordingSeconds(0)
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Elegir el mejor formato soportado por el browser
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
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = async () => {
        // Detener el stream de micrófono
        stream.getTracks().forEach(t => t.stop())

        const mimeType = recorder.mimeType || supportedMime || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })

        if (audioBlob.size === 0) return

        setIsTranscribing(true)
        try {
          const { text } = await transcribeAudio(audioBlob)
          if (text && text.trim()) {
            sendMessage(text.trim())
          }
        } catch (err) {
          console.error('Transcripción fallida:', err)
        } finally {
          setIsTranscribing(false)
        }
      }

      recorder.start(250) // recolectar chunks cada 250ms
      setIsRecording(true)
      setRecordingSeconds(0)

      // Timer de duración + límite de 5 min
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          const next = prev + 1
          if (next >= MAX_DURATION_SECONDS) {
            stopRecording()
          }
          return next
        })
      }, 1000)
    } catch (err) {
      console.error('No se pudo acceder al micrófono:', err)
      alert('No se pudo acceder al micrófono. Verifica los permisos.')
    }
  }, [stopRecording, sendMessage])

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const canSend = input.trim() && !isSending && activeFolder && !isRecording && !isTranscribing
  const showMic = !input.trim() && !isTranscribing
  const isDisabled = !activeFolder || isSending || isTranscribing

  return (
    <div style={{ padding: '0.75rem 1rem 1rem', background: '#212121' }}>
      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          background: '#2f2f2f',
          borderRadius: '1rem',
          padding: '0.75rem 0.75rem 0.75rem 1rem',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '0.5rem',
          border: isRecording
            ? '1px solid rgba(239,68,68,0.5)'
            : '1px solid rgba(255,255,255,0.08)',
          transition: 'border-color 0.2s',
        }}
      >
        <textarea
          ref={textareaRef}
          value={isTranscribing ? '' : input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isTranscribing
              ? 'Transcribiendo...'
              : isRecording
              ? 'Grabando...'
              : activeFolder
              ? `Escribe en ${activeFolder.name}...`
              : 'Selecciona una carpeta para comenzar...'
          }
          rows={1}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: '0.9rem',
            color: isTranscribing || isRecording
              ? 'rgba(255,255,255,0.4)'
              : 'rgba(255,255,255,0.88)',
            lineHeight: 1.6,
            maxHeight: '140px',
            fontFamily: 'inherit',
          }}
          disabled={isDisabled || isRecording}
          readOnly={isTranscribing}
        />

        {/* Timer de grabación */}
        {isRecording && (
          <span style={{
            fontSize: '0.75rem',
            color: 'rgba(239,68,68,0.9)',
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
            alignSelf: 'center',
          }}>
            {formatDuration(recordingSeconds)}
          </span>
        )}

        {/* Botón mic o enviar */}
        {showMic ? (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={!activeFolder || isTranscribing}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: activeFolder && !isTranscribing ? 'pointer' : 'not-allowed',
              background: isRecording ? '#ef4444' : 'rgba(255,255,255,0.1)',
              color: isRecording ? '#ffffff' : 'rgba(255,255,255,0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.15s ease',
              animation: isRecording ? 'micPulse 1.2s ease-in-out infinite' : 'none',
            }}
          >
            {isRecording ? <Square size={14} fill="currentColor" /> : <Mic size={16} />}
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: canSend ? 'pointer' : 'not-allowed',
              background: canSend ? '#ffffff' : 'rgba(255,255,255,0.1)',
              color: canSend ? '#111111' : 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowUp size={16} />
          </button>
        )}
      </form>

      {/* Animación pulse para el botón de grabar */}
      <style>{`
        @keyframes micPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
          50% { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }
      `}</style>

      <p style={{
        maxWidth: '720px',
        margin: '0.5rem auto 0',
        fontSize: '0.7rem',
        color: 'rgba(255,255,255,0.18)',
        textAlign: 'center',
      }}>
        {isRecording
          ? 'Toca el cuadrado para detener y transcribir'
          : 'Ozone recuerda todo lo que le contas. Shift+Enter para nueva linea.'}
      </p>
    </div>
  )
}
