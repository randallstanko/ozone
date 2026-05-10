import { Bot, User } from 'lucide-react'

export default function MessageBubble({ message }) {
  const isUser = message.origen === 'usuario'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? 'bg-ozone-primary/20' : 'bg-dark-700'
        }`}
      >
        {isUser ? (
          <User size={16} className="text-ozone-primary" />
        ) : (
          <Bot size={16} className="text-ozone-accent" />
        )}
      </div>

      {/* Bubble */}
      <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-ia'}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        <span className="text-[10px] text-dark-500 mt-1 block">
          {new Date(message.created_at).toLocaleTimeString('es', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  )
}
