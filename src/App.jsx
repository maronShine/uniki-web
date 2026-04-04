import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Etudiants from './pages/Etudiants'
import Verify from './pages/Verify'
import FicheEtudiant from './pages/FicheEtudiant'
import GestionUtilisateurs from './pages/GestionUtilisateurs'
import JournalModifications from './pages/JournalModifications'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', 
    justifyContent: 'center', backgroundColor: '#0f172a', color: '#38bdf8' }}>
      Chargement...
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/verify/:printId" element={<Verify />} />
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={session ? <Dashboard session={session} /> : <Navigate to="/login" />} />
        <Route path="/etudiants" element={session ? <Etudiants session={session} /> : <Navigate to="/login" />} />
        <Route path="/etudiant/:id" element={session ? <FicheEtudiant session={session} /> : <Navigate to="/login" />} />
        <Route path="/utilisateurs" element={session ? <GestionUtilisateurs session={session} /> : <Navigate to="/login" />} />
        <Route path="/journal" element={session ? <JournalModifications session={session} /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={session ? "/dashboard" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App