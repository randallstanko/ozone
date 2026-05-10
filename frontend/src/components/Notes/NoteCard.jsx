export default function NoteCard({ note, categorias }) {
  const categoria = categorias.find((c) => c.id === note.categoria)
  const Icon = categoria?.icon

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 hover:border-dark-500 transition-all">
      {/* Category Badge */}
      <div className="flex items-center gap-2 mb-3">
        {Icon && (
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ backgroundColor: (categoria?.color || '#6366f1') + '20' }}
          >
            <Icon size={12} style={{ color: categoria?.color }} />
          </div>
        )}
        <span
          className="text-[11px] font-medium uppercase tracking-wider"
          style={{ color: categoria?.color || '#6366f1' }}
        >
          {categoria?.label || note.categoria}
        </span>
        {note.auto_generated && (
          <span className="ml-auto text-[10px] text-dark-500 bg-dark-900 px-2 py-0.5 rounded-full">
            Auto
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2">
        {note.titulo}
      </h3>

      {/* Content */}
      <p className="text-xs text-dark-300 line-clamp-4 leading-relaxed">
        {note.contenido}
      </p>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-dark-700 flex items-center justify-between">
        <span className="text-[10px] text-dark-500">
          {new Date(note.created_at).toLocaleDateString('es', {
            day: 'numeric',
            month: 'short',
          })}
        </span>
        {note.importancia > 0 && (
          <div className="flex gap-0.5">
            {Array.from({ length: note.importancia }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-ozone-primary"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
