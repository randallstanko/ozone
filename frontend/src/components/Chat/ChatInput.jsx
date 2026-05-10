import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import useChatStore from '../../store/chatStore'

export default function ChatInput() {
  const [input, setInput] = useState('')
  const { sendMessage, isSending, activeFolder } = useChatStore()
  const textareaRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 150) + 'px'
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

  return (
    <form
      onSubmit={handleSubmit}
      className="px-6 pb-4 pt-2 border-t border-dark-800 shrink-0"
    >
      <div className="flex items-end gap-3 bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 focus-within:border-ozone-primary/50 transition-colors">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            activeFolder
              ? `Escribe en ${activeFolder.name}...`
              : 'Selecciona una carpeta...'
          }
          rows={1}
          className="flex-1 bg-transparent text-sm text-white placeholder-dark-400 resize-none focus:outline-none max-h-[150px]"
          disabled={!activeFolder || isSending}
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending || !activeFolder}
          className="p-2 rounded-lg bg-ozone-primary hover:bg-ozone-primary/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <Send size={16} />
        </button>
      </div>
      <p className="text-[11px] text-dark-500 mt-2 text-center">
        Ozone recuerda todo. Shift+Enter para nueva linea.
      </p>
    </form>
  )
}
