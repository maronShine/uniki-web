import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const location = useLocation()

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const isActivePath = (path) => {
    return location.pathname === path
  }

  return (
    <nav className="navbar" style={{
      height: '52px',
      backgroundColor: '#1e293b',
      borderBottom: '1px solid #334155',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px'
    }}>
      {/* Logo à gauche */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{
          width: '32px',
          height: '32px',
          backgroundColor: '#0ea5e9',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '12px'
        }}>
          <span style={{
            color: 'white',
            fontWeight: '700',
            fontSize: '14px'
          }}>UK</span>
        </div>
        <span style={{
          color: 'white',
          fontWeight: '600',
          fontSize: '16px'
        }}>UNIKI</span>
      </div>

      {/* Liens au centre */}
      <div style={{ display: 'flex', gap: '32px' }}>
        <Link
          to="/dashboard"
          style={{
            color: isActivePath('/dashboard') ? '#0ea5e9' : '#94a3b8',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500',
            borderBottom: isActivePath('/dashboard') ? '2px solid #0ea5e9' : 'none',
            paddingBottom: '2px',
            transition: 'color 0.2s'
          }}
          onMouseOver={(e) => {
            if (!isActivePath('/dashboard')) e.target.style.color = 'white'
          }}
          onMouseOut={(e) => {
            if (!isActivePath('/dashboard')) e.target.style.color = '#94a3b8'
          }}
        >
          Tableau de bord
        </Link>
        <Link
          to="/etudiants"
          style={{
            color: isActivePath('/etudiants') ? '#0ea5e9' : '#94a3b8',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500',
            borderBottom: isActivePath('/etudiants') ? '2px solid #0ea5e9' : 'none',
            paddingBottom: '2px',
            transition: 'color 0.2s'
          }}
          onMouseOver={(e) => {
            if (!isActivePath('/etudiants')) e.target.style.color = 'white'
          }}
          onMouseOut={(e) => {
            if (!isActivePath('/etudiants')) e.target.style.color = '#94a3b8'
          }}
        >
          Étudiants
        </Link>
      </div>

      {/* Email utilisateur et déconnexion à droite */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{
          color: '#94a3b8',
          fontSize: '14px'
        }}>
          {user?.email}
        </span>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: '#374151',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#374151'}
        >
          Déconnexion
        </button>
      </div>
    </nav>
  )
}
