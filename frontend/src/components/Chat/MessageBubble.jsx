export default function MessageBubble({ message }) {
  const isUser = message.origen === 'usuario'

  const timeStr = new Date(message.created_at).toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div style={{
      maxWidth: '760px',
      width: '100%',
      margin: '0 auto',
      padding: isUser ? '0.3rem 0' : '0.5rem 0',
    }}>
      {isUser ? (
        /* User message — right-aligned bubble */
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            maxWidth: '70%',
            background: 'linear-gradient(135deg, #3d3d3d 0%, #333333 100%)',
            borderRadius: '1.25rem 1.25rem 0.3rem 1.25rem',
            padding: '0.75rem 1.1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          }}>
            <p style={{
              margin: 0,
              fontSize: '0.92rem',
              color: 'rgba(255,255,255,0.93)',
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
            }}>
              {message.content}
            </p>
            <span style={{
              display: 'block',
              fontSize: '0.67rem',
              color: 'rgba(255,255,255,0.22)',
              marginTop: '0.3rem',
              textAlign: 'right',
            }}>
              {timeStr}
            </span>
          </div>
        </div>
      ) : (
        /* AI message — left-aligned with avatar */
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          {/* Ozone avatar */}
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(139,92,246,0.15) 100%)',
            border: '1px solid rgba(99,102,241,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '1px',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
          </div>
          {/* Text content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: 0,
              fontSize: '0.92rem',
              color: 'rgba(255,255,255,0.9)',
              lineHeight: 1.75,
              whiteSpace: 'pre-wrap',
            }}>
              {message.content}
            </p>
            <span style={{
              display: 'block',
              fontSize: '0.67rem',
              color: 'rgba(255,255,255,0.18)',
              marginTop: '0.35rem',
            }}>
              {timeStr}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
