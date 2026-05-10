# Ozone — Guia de Deploy

## Arquitectura
- **Frontend** → Vercel (gratis)
- **Backend** → Render (gratis)
- **Base de datos** → Supabase (ya configurado)

---

## 1. Prerequisitos

- Cuenta en [GitHub](https://github.com) (para conectar los servicios)
- Cuenta en [Render](https://render.com)
- Cuenta en [Vercel](https://vercel.com)
- Git instalado: https://git-scm.com/downloads

---

## 2. Subir el código a GitHub

```bash
# En la raíz del proyecto (C:\Users\randa\OneDrive\Desktop\Proyecto)
git init
git add .
git commit -m "Initial commit: Ozone app"

# Crear un repo en GitHub (sin README, sin .gitignore)
git remote add origin https://github.com/TU_USUARIO/ozone.git
git branch -M main
git push -u origin main
```

---

## 3. Deploy del Backend en Render

### Paso a paso:

1. Ir a **https://render.com** → New → **Web Service**
2. Conectar tu cuenta de GitHub y seleccionar el repo `ozone`
3. Configurar:
   | Campo | Valor |
   |-------|-------|
   | **Name** | `ozone-backend` |
   | **Root Directory** | `backend` |
   | **Environment** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `node src/index.js` |
   | **Plan** | `Free` |

4. En **Environment Variables**, agregar:

   | Variable | Valor |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `SUPABASE_URL` | `https://jairlmbadfotyoviehcu.supabase.co` |
   | `SUPABASE_ANON_KEY` | *(del .env local)* |
   | `SUPABASE_SERVICE_ROLE_KEY` | *(del .env local)* |
   | `GROQ_API_KEY` | *(del .env local)* |
   | `GEMINI_API_KEY` | *(del .env local)* |
   | `DEMO_USER_ID` | `00000000-0000-0000-0000-000000000001` |
   | `EMBEDDING_MODEL` | `gemini-embedding-001` |
   | `CHAT_MODEL` | `llama-3.3-70b-versatile` |
   | `SUMMARY_MODEL` | `llama-3.3-70b-versatile` |
   | `MAX_SHORT_MEMORY_MESSAGES` | `50` |
   | `SEMANTIC_SEARCH_THRESHOLD` | `0.5` |
   | `SEMANTIC_SEARCH_LIMIT` | `10` |
   | `FRONTEND_URL` | *(tu URL de Vercel, ej: `https://ozone.vercel.app`)* — agregar DESPUÉS de deployar el frontend |

5. Click **Create Web Service**
6. Esperar que termine el build (~2-3 min)
7. Anotar la URL pública: `https://ozone-backend.onrender.com`

> **Nota:** Los servicios free de Render "se duermen" tras 15 min de inactividad.
> La primera peticion tarda ~30s en despertar. Es normal.

---

## 4. Deploy del Frontend en Vercel

### Paso a paso:

1. Ir a **https://vercel.com** → New Project
2. Import desde GitHub → seleccionar repo `ozone`
3. Configurar:
   | Campo | Valor |
   |-------|-------|
   | **Root Directory** | `frontend` |
   | **Framework Preset** | Vite (auto-detectado) |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

4. En **Environment Variables**, agregar:

   | Variable | Valor |
   |----------|-------|
   | `VITE_API_URL` | `https://ozone-backend.onrender.com/api` |

5. Click **Deploy**
6. Esperar ~1 min
7. Anotar la URL: `https://ozone.vercel.app` (o similar)

---

## 5. Conectar Frontend → Backend (CORS)

Tras tener ambas URLs, volver a **Render** → ozone-backend → Environment:
- Agregar/actualizar `FRONTEND_URL` = `https://TU_APP.vercel.app`
- Render hara redeploy automatico

---

## 6. Verificar que todo funciona

```
GET https://ozone-backend.onrender.com/api/health
→ { "status": "ok", "service": "ozone-backend" }
```

Abrir `https://TU_APP.vercel.app` y probar crear una carpeta/mensaje.

---

## Variables de entorno — Resumen

### Backend (Render)
```
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://jairlmbadfotyoviehcu.supabase.co
SUPABASE_ANON_KEY=<del .env local>
SUPABASE_SERVICE_ROLE_KEY=<del .env local>
GROQ_API_KEY=<del .env local>
GEMINI_API_KEY=<del .env local>
FRONTEND_URL=https://tu-app.vercel.app
DEMO_USER_ID=00000000-0000-0000-0000-000000000001
EMBEDDING_MODEL=gemini-embedding-001
CHAT_MODEL=llama-3.3-70b-versatile
SUMMARY_MODEL=llama-3.3-70b-versatile
MAX_SHORT_MEMORY_MESSAGES=50
SEMANTIC_SEARCH_THRESHOLD=0.5
SEMANTIC_SEARCH_LIMIT=10
```

### Frontend (Vercel)
```
VITE_API_URL=https://ozone-backend.onrender.com/api
```
