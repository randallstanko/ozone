export default function MessageBubble({ message }) {
  const isUser = message.origen === 'usuario'

  const timeStr = new Date(message.created_at).toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div style={{
      maxWidth: '720px',
      width: '100%',
      margin: '0 auto',
      padding: isUser ? '0.4rem 0' : '0.6rem 0',
    }}>
      {isUser ? (
        /* User message — aligned right, subtle pill */
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            maxWidth: '75%',
            background: '#2f2f2f',
            borderRadius: '1.2rem 1.2rem 0.25rem 1.2rem',
            padding: '0.7rem 1rem',
          }}>
            <p style={{
              margin: 0,
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.9)',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}>
              {message.content}
            </p>
            <span style={{
              display: 'block',
              fontSize: '0.68rem',
              color: 'rgba(255,255,255,0.25)',
              marginTop: '0.25rem',
              textAlign: 'right',
            }}>
              {timeStr}
            </span>
          </div>
        </div>
      ) : (
        /* AI message — no bubble, icon + clean text */
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          {/* Ozone icon */}
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'rgba(99,102,241,0.14)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginTop: '2px',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" fill="#6366f1" opacity="0.9"/>
              <circle cx="4"  cy="8"  r="2" fill="#8b5cf6" opacity="0.6"/>
              <circle cx="20" cy="8"  r="2" fill="#8b5cf6" opacity="0.6"/>
              <circle cx="4"  cy="16" r="2" fill="#06b6d4" opacity="0.5"/>
              <circle cx="20" cy="16" r="2" fill="#06b6d4" opacity="0.5"/>
              <line x1="12" y1="12" x2="4"  y2="8"  stroke="#6366f1" strokeWidth="0.9" opacity="0.4"/>
              <line x1="12" y1="12" x2="20" y2="8"  stroke="#6366f1" strokeWidth="0.9" opacity="0.4"/>
              <line x1="12" y1="12" x2="4"  y2="16" stroke="#06b6d4" strokeWidth="0.9" opacity="0.35"/>
              <line x1="12" y1="12" x2="20" y2="16" stroke="#06b6d4" strokeWidth="0.9" opacity="0.35"/>
            </svg>
          </div>
          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: 0,
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}>
              {message.content}
            </p>
            <span style={{
              display: 'block',
              fontSize: '0.68rem',
              color: 'rgba(255,255,255,0.2)',
              marginTop: '0.3rem',
            }}>
              {timeStr}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
