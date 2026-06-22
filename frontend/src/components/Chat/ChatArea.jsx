import { useEffect, useRef, useState } from 'react'
import { Headphones } from 'lucide-react'
import useChatStore from '../../store/chatStore'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import VoiceMode from '../Voice/VoiceMode'

// Ozone orb SVG — reusable
function OzoneOrb({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" fill="#818cf8" opacity="1"/>
      <circle cx="4"  cy="8"  r="1.8" fill="#a78bfa" opacity="0.7"/>
      <circle cx="20" cy="8"  r="1.8" fill="#a78bfa" opacity="0.7"/>
      <circle cx="4"  cy="16" r="1.8" fill="#22d3ee" opacity="0.6"/>
      <circle cx="20" cy="16" r="1.8" fill="#22d3ee" opacity="0.6"/>
      <line x1="12" y1="12" x2="4"  y2="8"  stroke="#818cf8" strokeWidth="1" opacity="0.5"/>
      <line x1="12" y1="12" x2="20" y2="8"  stroke="#818cf8" strokeWidth="1" opacity="0.5"/>
      <line x1="12" y1="12" x2="4"  y2="16" stroke="#22d3ee" strokeWidth="1" opacity="0.4"/>
      <line x1="12" y1="12" x2="20" y2="16" stroke="#22d3ee" strokeWidth="1" opacity="0.4"/>
    </svg>
  )
}

export default function ChatArea() {
  const { messages, activeFolder, isLoading, isSending } = useChatStore()
  const [voiceOpen, setVoiceOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    const behavior = isFirstRender.current ? 'instant' : 'smooth'
    isFirstRender.current = false
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [messages])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#212121' }}>
      {/* Voice mode overlay */}
      {voiceOpen && <VoiceMode onClose={() => setVoiceOpen(false)} />}

      {/* Desktop header — minimal, just folder name + voice button */}
      <header
        className="hidden md:flex"
        style={{
          height: '52px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          flexShrink: 0,
          background: '#212121',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {activeFolder && (
            <>
              <span style={{ fontSize: '1rem' }}>{activeFolder.icon}</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                {activeFolder.name}
              </span>
            </>
          )}
        </div>

        {/* Voice button */}
        {activeFolder && (
          <button
            onClick={() => setVoiceOpen(true)}
            title="Modo voz"
            className="voice-btn"
          >
            <Headphones size={15} />
          </button>
        )}
      </header>

      {/* Messages scroll area */}
      <div className="messages-container">
        {isLoading ? (
          /* Loading spinner */
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            height: '100%',
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.1)',
              borderTopColor: '#6366f1',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>

        ) : messages.length === 0 ? (
          /* Empty state — ChatGPT style */
          <div className="empty-state">
            <div className="empty-orb">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3.5" fill="#818cf8" opacity="0.9"/>
                <circle cx="4"  cy="8"  r="2.2" fill="#a78bfa" opacity="0.65"/>
                <circle cx="20" cy="8"  r="2.2" fill="#a78bfa" opacity="0.65"/>
                <circle cx="4"  cy="16" r="2.2" fill="#22d3ee" opacity="0.55"/>
                <circle cx="20" cy="16" r="2.2" fill="#22d3ee" opacity="0.55"/>
                <line x1="12" y1="12" x2="4"  y2="8"  stroke="#818cf8" strokeWidth="0.9" opacity="0.45"/>
                <line x1="12" y1="12" x2="20" y2="8"  stroke="#818cf8" strokeWidth="0.9" opacity="0.45"/>
                <line x1="12" y1="12" x2="4"  y2="16" stroke="#22d3ee" strokeWidth="0.9" opacity="0.38"/>
                <line x1="12" y1="12" x2="20" y2="16" stroke="#22d3ee" strokeWidth="0.9" opacity="0.38"/>
              </svg>
            </div>
            <div>
              <p style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.85)',
                margin: '0 0 0.4rem',
              }}>
                {activeFolder ? `Como puedo ayudarte?` : 'Selecciona una carpeta'}
              </p>
              <p style={{
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.35)',
                margin: 0,
                lineHeight: 1.6,
              }}>
                {activeFolder
                  ? 'Recuerdo todo lo que hemos hablado.'
                  : 'Elige una carpeta de la sidebar para comenzar.'}
              </p>
            </div>
          </div>

        ) : (
          /* Messages */
          <div className="messages-inner">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Typing indicator */}
            {isSending && (
              <div className="message-row" style={{ padding: '0.5rem 0' }}>
                <div className="msg-ai-row">
                  <div className="msg-ai-avatar">
                    <OzoneOrb size={14} />
                  </div>
                  <div style={{ display: 'flex', gap: '5px', paddingTop: '6px' }}>
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} style={{ height: '1px' }} />
          </div>
        )}
      </div>

      {/* Chat input */}
      <ChatInput onVoiceOpen={() => setVoiceOpen(true)} />

      {/* Mobile voice FAB — visible only when not in voice mode */}
      {activeFolder && !voiceOpen && (
        <button
          className="md:hidden"
          onClick={() => setVoiceOpen(true)}
          aria-label="Modo voz"
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '1rem',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '1px solid rgba(99,102,241,0.3)',
            background: 'rgba(99,102,241,0.18)',
            color: '#818cf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 40,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Headphones size={18} />
        </button>
      )}
    </div>
  )
}
