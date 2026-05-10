import { useEffect, useRef } from 'react'
import { Brain } from 'lucide-react'
import useChatStore from '../../store/chatStore'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'

export default function ChatArea() {
  const { messages, activeFolder, isLoading, isSending } = useChatStore()
  const messagesEndRef = useRef(null)
  const isFirstRender = useRef(true)

  // Scroll to bottom on every messages change.
  // Use 'instant' on first render so the initial load doesn't animate from top.
  useEffect(() => {
    const behavior = isFirstRender.current ? 'instant' : 'smooth'
    isFirstRender.current = false
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [messages])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Desktop folder header (hidden on mobile — mobile header is in App.jsx) */}
      <header className="h-14 border-b border-dark-800 flex items-center px-6 shrink-0 hidden md:flex">
        {activeFolder && (
          <div className="flex items-center gap-3">
            <span className="text-xl">{activeFolder.icon}</span>
            <h2 className="font-semibold text-white">{activeFolder.name}</h2>
          </div>
        )}
      </header>

      {/* Messages — only this area scrolls */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ozone-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-dark-400">
            <Brain size={48} className="mb-4 text-dark-600" />
            <p className="text-lg font-medium">Comienza una conversacion</p>
            <p className="text-sm mt-1">
              Escribe algo y Ozone recordara todo por ti
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isSending && (
              <div className="chat-bubble-ia">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
          </>
        )}
        {/* Scroll anchor — always at the bottom */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input — flex-none keeps it pinned, never scrolls */}
      <div className="shrink-0">
        <ChatInput />
      </div>
    </div>
  )
}
