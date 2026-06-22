import { useEffect, useRef, useState } from 'react'
import { Headphones, ArrowRight } from 'lucide-react'
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

// Returns greeting based on current hour
function getGreeting(name) {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return `Buenos dias, ${name} 👋`
  if (hour >= 12 && hour < 19) return `Buenas tardes, ${name} 👋`
  return `Buenas noches, ${name} 👋`
}

const SUGGESTIONS = [
  'Como van mis objetivos de este mes?',
  'Recordame mis 3 prioridades actuales',
  'Que patron estas viendo en mi ultimamente?',
  'Ayudame a pensar sobre algo importante',
]

export default function ChatArea() {
  const { messages, activeFolder, isLoading, isSending, user } = useChatStore()
  const { sendMessage } = useChatStore()
  const [voiceOpen, setVoiceOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const isFirstRender = useRef(true)

  const displayName = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || 'Usuario'

  useEffect(() => {
    const behavior = isFirstRender.current ? 'instant' : 'smooth'
    isFirstRender.current = false
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [messages])

  const handleSuggestion = (text) => {
    if (!activeFolder) return
    sendMessage(text)
  }

  return (
    <div className="chat-area">
      {/* Voice mode overlay */}
      {voiceOpen && <VoiceMode onClose={() => setVoiceOpen(false)} />}

      {/* Desktop header */}
      <header className="chat-header hidden md:flex">
        <div className="chat-header-folder">
          {activeFolder && (
            <>
              <span style={{ fontSize: '1rem' }}>{activeFolder.icon}</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                {activeFolder.name}
              </span>
            </>
          )}
        </div>

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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            height: '100%',
          }}>
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              border: '2px solid rgba(99,102,241,0.15)',
              borderTopColor: '#6366f1',
              animation: 'spin 0.75s linear infinite',
            }} />
          </div>

        ) : messages.length === 0 ? (
          /* Empty state — greeting + suggestion chips */
          <div className="empty-state">
            {/* Orb icon */}
            <div className="empty-orb" style={{ animation: 'orbFloat 3s ease-in-out infinite, fadeSlideUp 400ms ease both' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3.5" fill="#818cf8" opacity="0.95"/>
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

            {activeFolder ? (
              <>
                <p className="greeting-time">{getGreeting(displayName)}</p>
                <p className="greeting-subtitle">En que puedo ayudarte hoy?</p>

                <div className="suggestion-chips">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      className="suggestion-chip"
                      onClick={() => handleSuggestion(s)}
                      style={{ animationDelay: `${200 + i * 60}ms` }}
                    >
                      {s}
                      <ArrowRight size={12} style={{ flexShrink: 0, opacity: 0.5 }} />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="select-folder-hint">
                Elige un contexto de la barra lateral para comenzar
              </p>
            )}
          </div>

        ) : (
          /* Messages list */
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
                  <div style={{ display: 'flex', gap: '5px', paddingTop: '8px', alignItems: 'center' }}>
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

      {/* Mobile voice FAB */}
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
            border: '1px solid rgba(99,102,241,0.28)',
            background: 'rgba(10,10,15,0.85)',
            color: '#818cf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 40,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            transition: 'transform 200ms ease',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Headphones size={18} />
        </button>
      )}
    </div>
  )
}
