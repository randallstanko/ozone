# OZONE MVP - Segundo Cerebro con IA

## Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 + Zustand 4 |
| Backend | Node.js 20 + Express 4 |
| Base de Datos | Supabase (PostgreSQL + pgvector) |
| IA | OpenAI GPT-4o + text-embedding-3-small |

## Estructura del Proyecto

```
Proyecto/
├── PLAN.md
├── .gitignore
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── sql/schema.sql
│   └── src/
│       ├── index.js
│       ├── config/ (supabase.js, openai.js)
│       ├── routes/ (folders, messages, chat, notes, memory)
│       ├── services/ (embedding, memory, ai, summary, tag)
│       ├── middleware/ (auth, errorHandler)
│       └── utils/ (contextBuilder, constants)
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── components/ (Sidebar, Chat, Notes, common)
        ├── store/ (chatStore.js)
        └── services/ (api.js)
```

## Sistema de Memoria (4 Capas)

1. **Corta**: Ultimos 20 mensajes de la conversacion actual
2. **Larga**: Resumenes acumulados por carpeta (cada 30 msgs)
3. **Semantica**: Top 5 mensajes similares via embeddings (threshold 0.7)
4. **Global**: Perfil del usuario (temas, metas, emociones, decisiones)

## Pipeline de Mensaje

1. Guardar mensaje → 2. Generar embedding → 3. Buscar similares →
4. Traer memoria corta → 5. Traer resumenes → 6. Traer perfil global →
7. Armar contexto → 8. GPT-4o responde → 9. Guardar respuesta →
10. Post-procesamiento async (tags, notas, actualizacion de memoria)

## Configuracion

### Variables de Entorno - Backend (.env)
```
PORT=3001
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-proj-...
DEMO_USER_ID=00000000-0000-0000-0000-000000000001
EMBEDDING_MODEL=text-embedding-3-small
CHAT_MODEL=gpt-4o
SUMMARY_MODEL=gpt-4o-mini
MAX_SHORT_MEMORY_MESSAGES=20
SEMANTIC_SEARCH_THRESHOLD=0.7
SEMANTIC_SEARCH_LIMIT=5
```

### Variables de Entorno - Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Ozone
```

## Como Ejecutar

1. **Base de datos**: Ejecutar `backend/sql/schema.sql` en Supabase SQL Editor
2. **Backend**: `cd backend && npm install && npm run dev`
3. **Frontend**: `cd frontend && npm install && npm run dev`
4. Abrir http://localhost:5173

## API Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/folders | Listar carpetas |
| POST | /api/folders | Crear carpeta |
| PUT | /api/folders/:id | Editar carpeta |
| DELETE | /api/folders/:id | Eliminar carpeta |
| GET | /api/messages/:folderId | Mensajes de carpeta |
| POST | /api/messages | Guardar mensaje |
| DELETE | /api/messages/:id | Eliminar mensaje |
| POST | /api/chat | Pipeline completo con IA |
| GET | /api/notes | Listar notas |
| PUT | /api/notes/:id | Editar nota |
| DELETE | /api/notes/:id | Eliminar nota |
| GET | /api/memory/global | Memoria global |
| GET | /api/memory/search?q= | Busqueda semantica |
| POST | /api/memory/summarize | Generar resumen |
