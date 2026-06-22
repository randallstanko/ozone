import ReactMarkdown from 'react-markdown'

// Ozone orb avatar for AI messages
function OzoneOrb() {
  return (
    <div className="msg-ai-avatar">
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

function formatTime(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

export default function MessageBubble({ message }) {
  const isUser = message.origen === 'usuario'
  const time = formatTime(message.created_at)

  return (
    <div className="message-row">
      {isUser ? (
        /* User message — right-aligned bubble */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div className="msg-user-bubble">
            {message.content}
          </div>
          {time && <span className="msg-timestamp">{time}</span>}
        </div>
      ) : (
        /* AI message — left-aligned, markdown rendered */
        <div className="msg-ai-row">
          <OzoneOrb />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="msg-ai-text">
              <ReactMarkdown
                components={{
                  // Override anchor to open in new tab
                  a: ({ node, ...props }) => (
                    <a {...props} target="_blank" rel="noopener noreferrer" />
                  ),
                  // Prevent wrapping code blocks in extra elements
                  pre: ({ node, ...props }) => <pre {...props} />,
                  code: ({ node, inline, ...props }) =>
                    inline
                      ? <code {...props} />
                      : <code {...props} />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            {time && (
              <span className="msg-timestamp" style={{ textAlign: 'left', marginTop: '0.35rem', display: 'block' }}>
                {time}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
