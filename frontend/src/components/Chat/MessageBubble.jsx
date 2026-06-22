// Ozone orb icon — inline SVG
function OzoneOrb() {
  return (
    <div style={{
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.1) 100%)',
      border: '1px solid rgba(99,102,241,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: '2px',
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
  )
}

export default function MessageBubble({ message }) {
  const isUser = message.origen === 'usuario'

  return (
    <div className="message-row">
      {isUser ? (
        /* User message — right-aligned bubble */
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div className="msg-user-bubble">
            {message.content}
          </div>
        </div>
      ) : (
        /* AI message — left-aligned, no bubble, avatar on left */
        <div className="msg-ai-row">
          <OzoneOrb />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="msg-ai-text">
              {message.content}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
