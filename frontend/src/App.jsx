import { useState, useEffect, useRef } from 'react'
import { Menu, Download } from 'lucide-react'
import Sidebar from './components/Sidebar/Sidebar'
import ChatArea from './components/Chat/ChatArea'
import NotesPanel from './components/Notes/NotesPanel'
import SplashScreen from './components/common/SplashScreen'
import AuthScreen from './components/Auth/AuthScreen'
import useChatStore from './store/chatStore'
import { supabase } from './config/supabase'
import * as api from './services/api'

const _rawApi = import.meta.env.VITE_API_URL || 'https://ozone-0qpm.onrender.com/api'
const BACKEND_URL = _rawApi.replace(/\/api\/?$/, '')

function pingBackend() {
  fetch(`${BACKEND_URL}/api/health`, { method: 'GET' })
    .then(() => console.log('[Wake-up] backend ping OK'))
    .catch(() => console.log('[Wake-up] backend ping failed (still waking)'))
}

function App() {
  const [view, setView] = useState('chat')
  const [dataReady, setDataReady] = useState(false)
  const [splashMounted, setSplashMounted] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [setupDone, setSetupDone] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const deferredPromptRef = useRef(null)
  const { sidebarOpen, toggleSidebar, closeSidebar, fetchFolders, session, setSession, activeFolder } = useChatStore()

  useEffect(() => { pingBackend() }, [])

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      deferredPromptRef.current = e
      setInstallPrompt(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPromptRef.current) return
    deferredPromptRef.current.prompt()
    const { outcome } = await deferredPromptRef.current.userChoice
    if (outcome === 'accepted') setInstallPrompt(false)
    deferredPromptRef.current = null
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s)
      if (s) {
        try {
          const name = s.user?.user_metadata?.full_name || s.user?.email
          await api.authSetup(name)
        } catch (err) {
          console.error('[Auth] setup error (getSession path):', err?.response?.status, err?.message)
        }
        setSetupDone(true)
      }
      setAuthChecked(true)
    }).catch(() => { setAuthChecked(true) })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s)
      if (s && (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED')) {
        try {
          const name = s.user?.user_metadata?.full_name || s.user?.email
          await api.authSetup(name)
        } catch (err) {
          console.error('[Auth] setup error (onAuthStateChange path):', err?.response?.status, err?.message)
        }
        setSetupDone(true)
        setAuthChecked(true)
      }
      if (!s) {
        setSetupDone(false)
        setDataReady(false)
        setSplashMounted(true)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authChecked || !session || !setupDone) return
    const load = async () => {
      await fetchFolders()
      setDataReady(true)
      setTimeout(() => setSplashMounted(false), 950)
    }
    load()
  }, [authChecked, session, setupDone]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAuth = async (newSession) => {
    setSession(newSession)
    try {
      const name = newSession.user?.user_metadata?.full_name || newSession.user?.email
      await api.authSetup(name)
    } catch { /* normal */ }
    setSetupDone(true)
  }

  if (!authChecked) return <SplashScreen visible={true} />
  if (!session) return <AuthScreen onAuth={handleAuth} />

  return (
    <>
      {splashMounted && <SplashScreen visible={!dataReady} />}

      <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#212121' }}>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar */}
        <Sidebar currentView={view} onViewChange={setView} />

        {/* Main content */}
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
          background: '#212121',
        }}>
          {/* Mobile top bar — hamburger + folder name */}
          <div
            className="md:hidden"
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              height: '52px',
              padding: '0 1rem',
              background: '#212121',
              flexShrink: 0,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Hamburger */}
            <button
              onClick={toggleSidebar}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.6)',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                minWidth: '44px',
                minHeight: '44px',
              }}
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>

            {/* Folder name — centered */}
            <span style={{
              flex: 1,
              textAlign: 'center',
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.88)',
            }}>
              {activeFolder ? activeFolder.name : 'Ozone'}
            </span>

            {/* Install button or spacer */}
            {installPrompt ? (
              <button
                onClick={handleInstall}
                title="Instalar Ozone"
                style={{
                  background: 'linear-gradient(135deg, #4f1b7c, #7c3aed)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: '#fff',
                  padding: '5px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  minHeight: '44px',
                }}
              >
                <Download size={13} />
                Instalar
              </button>
            ) : (
              <div style={{ minWidth: '44px' }} />
            )}
          </div>

          {view === 'chat' ? <ChatArea /> : <NotesPanel />}
        </main>
      </div>
    </>
  )
}

export default App
