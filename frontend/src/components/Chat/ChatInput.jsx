import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowUp, Mic, Square, Headphones } from 'lucide-react'
import useChatStore from '../../store/chatStore'
import { transcribeAudio } from '../../services/api'

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const MAX_DURATION_SECONDS = 300

export default function ChatInput({ onVoiceOpen }) {
  const [input, setInput] = useState('')
  const { sendMessage, isSending, activeFolder } = useChatStore()
  const textareaRef = useRef(null)

  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px'
    }
  }, [input])

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
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
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
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const mimeType = recorder.mimeType || supportedMime || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        if (audioBlob.size === 0) return
        setIsTranscribing(true)
        try {
          const { text } = await transcribeAudio(audioBlob)
          if (text && text.trim()) sendMessage(text.trim())
        } catch (err) {
          console.error('Transcripcion fallida:', err)
        } finally {
          setIsTranscribing(false)
        }
      }

      recorder.start(250)
      setIsRecording(true)
      setRecordingSeconds(0)

      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          const next = prev + 1
          if (next >= MAX_DURATION_SECONDS) stopRecording()
          return next
        })
      }, 1000)
    } catch (err) {
      console.error('No se pudo acceder al microfono:', err)
      alert('No se pudo acceder al microfono. Verifica los permisos.')
    }
  }, [stopRecording, sendMessage])

  const handleMicClick = () => {
    if (isRecording) stopRecording()
    else startRecording()
  }

  const hasText = input.trim().length > 0
  const canSend = hasText && !isSending && !!activeFolder && !isRecording && !isTranscribing
  const isDisabled = !activeFolder || isSending || isTranscribing

  return (
    <div className="chat-input-wrap">
      <form
        onSubmit={handleSubmit}
        className={`chat-input-form${isRecording ? ' recording' : ''}`}
      >
        {/* Textarea */}
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
              ? 'Escribe tu mensaje...'
              : 'Selecciona un contexto para chatear...'
          }
          rows={1}
          className="chat-textarea"
          style={{
            color: isTranscribing || isRecording
              ? 'rgba(255,255,255,0.28)'
              : 'rgba(255,255,255,0.92)',
          }}
          disabled={isDisabled || isRecording}
          readOnly={isTranscribing}
        />

        {/* Recording timer */}
        {isRecording && (
          <span style={{
            fontSize: '0.75rem',
            color: 'rgba(239,68,68,0.9)',
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
            alignSelf: 'center',
            fontWeight: 600,
          }}>
            {formatDuration(recordingSeconds)}
          </span>
        )}

        {/* Right-side buttons: headphones | mic-or-send */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
          {/* Voice mode button — always visible, indigo accent */}
          {onVoiceOpen && (
            <button
              type="button"
              onClick={onVoiceOpen}
              title="Modo voz"
              className="voice-btn"
              disabled={!activeFolder}
              style={{ opacity: activeFolder ? 1 : 0.35, cursor: activeFolder ? 'pointer' : 'not-allowed' }}
            >
              <Headphones size={15} />
            </button>
          )}

          {/* Divider */}
          <div style={{
            width: '1px',
            height: '20px',
            background: 'rgba(255,255,255,0.07)',
            flexShrink: 0,
          }} />

          {/* Mic button — only when no text */}
          {!hasText && (
            <button
              type="button"
              onClick={handleMicClick}
              disabled={!activeFolder || isTranscribing}
              className={`mic-btn${isRecording ? ' recording' : ''}`}
              title={isRecording ? 'Detener grabacion' : 'Grabar audio'}
            >
              {isRecording
                ? <Square size={14} fill="currentColor" />
                : <Mic size={16} />
              }
            </button>
          )}

          {/* Send button — only when there's text */}
          {hasText && (
            <button
              type="submit"
              disabled={!canSend}
              className="send-btn"
              title="Enviar mensaje"
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </form>

      {/* Disclaimer */}
      <p className="chat-disclaimer">
        {isRecording
          ? 'Toca el cuadrado para detener y enviar'
          : 'Ozone puede cometer errores. Considera verificar la informacion importante.'}
      </p>
    </div>
  )
}
