import { useState, useRef, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import useChatStore from '../../store/chatStore'

export default function ChatInput() {
  const [input, setInput] = useState('')
  const { sendMessage, isSending, activeFolder } = useChatStore()
  const textareaRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 140) + 'px'
    }
  }, [input])

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

  const canSend = input.trim() && !isSending && activeFolder

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
          border: '1px solid rgba(255,255,255,0.08)',
          transition: 'border-color 0.2s',
        }}
        onFocus={() => {}}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            activeFolder
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
            color: 'rgba(255,255,255,0.88)',
            lineHeight: 1.6,
            maxHeight: '140px',
            fontFamily: 'inherit',
          }}
          disabled={!activeFolder || isSending}
        />
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
      </form>
      <p style={{
        maxWidth: '720px',
        margin: '0.5rem auto 0',
        fontSize: '0.7rem',
        color: 'rgba(255,255,255,0.18)',
        textAlign: 'center',
      }}>
        Ozone recuerda todo lo que le contas. Shift+Enter para nueva linea.
      </p>
    </div>
  )
}
