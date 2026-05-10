import { useState, useEffect } from 'react'
import { Brain, Lightbulb, Target, GitBranch, FileText, DollarSign, Heart, Rocket, BookOpen, Sparkles } from 'lucide-react'
import * as api from '../../services/api'
import NoteCard from './NoteCard'

const CATEGORIAS = [
  { id: 'ideas', label: 'Ideas', icon: Lightbulb, color: '#f59e0b' },
  { id: 'metas', label: 'Metas', icon: Target, color: '#10b981' },
  { id: 'decisiones', label: 'Decisiones', icon: GitBranch, color: '#6366f1' },
  { id: 'resumenes', label: 'Resumenes', icon: FileText, color: '#8b5cf6' },
  { id: 'finanzas', label: 'Finanzas', icon: DollarSign, color: '#10b981' },
  { id: 'relaciones', label: 'Relaciones', icon: Heart, color: '#f43f5e' },
  { id: 'proyectos', label: 'Proyectos', icon: Rocket, color: '#f59e0b' },
  { id: 'aprendizajes', label: 'Aprendizajes', icon: BookOpen, color: '#3b82f6' },
  { id: 'reflexiones', label: 'Reflexiones', icon: Sparkles, color: '#a855f7' },
]

export default function NotesPanel() {
  const [activeCategoria, setActiveCategoria] = useState(null)
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchNotes()
  }, [activeCategoria])

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const params = activeCategoria ? { categoria: activeCategoria } : {}
      const { data } = await api.getNotes(params)
      setNotes(data)
    } catch (err) {
      console.error('Error fetching notes:', err)
    }
    setLoading(false)
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <header className="h-14 border-b border-dark-800 flex items-center px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Brain size={22} className="text-ozone-secondary" />
          <h2 className="font-semibold text-white">Segundo Cerebro</h2>
        </div>
      </header>

      {/* Categories */}
      <div className="px-6 py-4 border-b border-dark-800 shrink-0">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategoria(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              !activeCategoria
                ? 'bg-ozone-primary text-white'
                : 'bg-dark-800 text-dark-300 hover:text-white hover:bg-dark-700'
            }`}
          >
            Todas
          </button>
          {CATEGORIAS.map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoria(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCategoria === cat.id
                    ? 'text-white'
                    : 'bg-dark-800 text-dark-300 hover:text-white hover:bg-dark-700'
                }`}
                style={
                  activeCategoria === cat.id
                    ? { backgroundColor: cat.color + '30', color: cat.color }
                    : {}
                }
              >
                <Icon size={12} />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Notes Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ozone-primary"></div>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-dark-400">
            <Brain size={48} className="mb-4 text-dark-600" />
            <p className="text-lg font-medium">Sin notas aun</p>
            <p className="text-sm mt-1">
              Las notas se generan automaticamente mientras chateas
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} categorias={CATEGORIAS} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
