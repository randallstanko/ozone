import { useEffect, useRef, useState } from 'react'
import { Mic2 } from 'lucide-react'
import useChatStore from '../../store/chatStore'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import VoiceMode from '../Voice/VoiceMode'

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

      {/* Desktop header */}
      <header
        className="hidden md:flex"
        style={{
          height: '52px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          flexShrink: 0,
          background: '#212121',
        }}
      >
        {activeFolder && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.1rem' }}>{activeFolder.icon}</span>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
              {activeFolder.name}
            </h2>
          </div>
        )}
        {/* Voice mode button — desktop */}
        {activeFolder && (
          <button
            onClick={() => setVoiceOpen(true)}
            title="Modo voz"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(99,102,241,0.12)',
              color: '#818cf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.22)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(99,102,241,0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <Mic2 size={15} />
          </button>
        )}
      </header>

      {/* Messages scroll area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          padding: '2rem 1.25rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
        }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.1)',
              borderTopColor: '#6366f1',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '1.25rem',
            userSelect: 'none',
          }}>
            {/* Large orb icon */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, rgba(129,140,248,0.2) 0%, rgba(99,102,241,0.08) 100%)',
              border: '1px solid rgba(99,102,241,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(99,102,241,0.12)',
            }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
              <p style={{ fontSize: '1.15rem', fontWeight: 600, color: 'rgba(255,255,255,0.82)', margin: 0 }}>
                {activeFolder ? `Hola, soy Ozone` : 'Selecciona una carpeta'}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', margin: 0, textAlign: 'center', maxWidth: '260px', lineHeight: 1.6 }}>
                {activeFolder
                  ? 'Escribe algo para empezar.\nRecuerdo todo lo que me contás.'
                  : 'Elige una carpeta de la sidebar para comenzar a chatear.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isSending && (
              <div style={{ maxWidth: '760px', width: '100%', margin: '0 auto', padding: '0.5rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                  {/* Ozone avatar */}
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(139,92,246,0.15) 100%)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    marginTop: '1px',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="3" fill="#818cf8" opacity="1"/>
                      <circle cx="4"  cy="8"  r="1.8" fill="#a78bfa" opacity="0.7"/>
                      <circle cx="20" cy="8"  r="1.8" fill="#a78bfa" opacity="0.7"/>
                      <line x1="12" y1="12" x2="4"  y2="8"  stroke="#818cf8" strokeWidth="1" opacity="0.5"/>
                      <line x1="12" y1="12" x2="20" y2="8"  stroke="#818cf8" strokeWidth="1" opacity="0.5"/>
                    </svg>
                  </div>
                  {/* Typing dots */}
                  <div style={{ display: 'flex', gap: '5px', paddingTop: '8px' }}>
                    {[0, 150, 300].map((delay, i) => (
                      <div key={i} style={{
                        width: '7px', height: '7px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.3)',
                        animation: 'typing-dot 1.2s ease-in-out infinite',
                        animationDelay: `${delay}ms`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input */}
      <div style={{ flexShrink: 0 }}>
        <ChatInput />
      </div>

      {/* Mobile voice FAB */}
      {activeFolder && (
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
          <Mic2 size={18} />
        </button>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes typing-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1.1); opacity: 0.9; }
        }
      `}</style>
    </div>
  )
}
