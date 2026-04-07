import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRole } from '../hooks/useRole'
import { useWindowWidth } from '../hooks/useWindowWidth'

export default function Navbar({ session }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { role, loading: roleLoading } = useRole(session)
  const width = useWindowWidth()
  const isMobile = width < 768
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const linkStyle = (path) => ({
    fontSize: '14px',
    cursor: 'pointer',
    color: location.pathname === path ? '#C8860A' : '#8FA3B3',
    borderBottom: location.pathname === path ? '2px solid #C8860A' : '2px solid transparent',
    paddingBottom: '2px',
    transition: 'all 0.2s'
  })

  const mobileLinkStyle = (path) => ({
    fontSize: '14px',
    cursor: 'pointer',
    color: location.pathname === path ? '#C8860A' : '#8FA3B3',
    padding: '8px 0'
  })

  return (
    <div style={{
      backgroundColor: '#1C2B3A',
      borderBottom: '1px solid #DDE3EC',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      position: 'relative',
      zIndex: 100
    }}>
      {/* Barre principale */}
      <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px',
            backgroundColor: '#C8860A', borderRadius: '8px'
          }}>
            <span style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>UK</span>
          </div>
          <span style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>UNIKI</span>
        </div>

        {/* Navigation Desktop */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: '2rem' }}>
            <span onClick={() => navigate('/dashboard')} style={linkStyle('/dashboard')}>
              Tableau de bord
            </span>
            <span onClick={() => navigate('/etudiants')} style={linkStyle('/etudiants')}>
              Étudiants
            </span>
            {!roleLoading && role === 'super_admin' && (
              <span onClick={() => navigate('/utilisateurs')} style={linkStyle('/utilisateurs')}>
                Utilisateurs
              </span>
            )}
            {!roleLoading && role === 'super_admin' && (
              <span onClick={() => navigate('/journal')} style={linkStyle('/journal')}>
                Journal
              </span>
            )}
          </div>
        )}

        {/* User Info Desktop */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {!roleLoading && role && (
              <span style={{
                backgroundColor: '#C8860A', color: 'white',
                padding: '2px 10px', borderRadius: '12px',
                fontSize: '11px', fontWeight: '600', textTransform: 'uppercase'
              }}>
                {role === 'super_admin' ? 'Admin' :
                 role === 'direction' ? 'Direction' :
                 role === 'comptabilite' ? 'Compta' : 'Scolarité'}
              </span>
            )}
            <span style={{ color: '#8FA3B3', fontSize: '13px' }}>
              {session?.user?.email}
            </span>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: 'transparent', color: '#8FA3B3',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '6px 14px', borderRadius: '6px',
                fontSize: '13px', fontWeight: '500', cursor: 'pointer'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white' }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8FA3B3' }}
            >
              Déconnexion
            </button>
          </div>
        )}

        {/* Hamburger Mobile */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              backgroundColor: 'transparent', border: 'none',
              color: '#8FA3B3', fontSize: '22px', cursor: 'pointer', padding: '4px'
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        )}
      </div>

      {/* Menu Mobile Dropdown */}
      {isMobile && menuOpen && (
        <div style={{
          backgroundColor: '#1C2B3A',
          borderTop: '1px solid #2E3F50',
          padding: '1rem 24px',
          display: 'flex', flexDirection: 'column', gap: '0.5rem'
        }}>
          <span onClick={() => { navigate('/dashboard'); setMenuOpen(false) }} style={mobileLinkStyle('/dashboard')}>
            Tableau de bord
          </span>
          <span onClick={() => { navigate('/etudiants'); setMenuOpen(false) }} style={mobileLinkStyle('/etudiants')}>
            Étudiants
          </span>
          {!roleLoading && role === 'super_admin' && (
            <span onClick={() => { navigate('/utilisateurs'); setMenuOpen(false) }} style={mobileLinkStyle('/utilisateurs')}>
              Utilisateurs
            </span>
          )}
          {!roleLoading && role === 'super_admin' && (
            <span onClick={() => { navigate('/journal'); setMenuOpen(false) }} style={mobileLinkStyle('/journal')}>
              Journal
            </span>
          )}

          <div style={{ borderTop: '1px solid #2E3F50', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '12px', color: '#8FA3B3' }}>
                {session?.user?.email}
              </span>
              {!roleLoading && role && (
                <span style={{
                  backgroundColor: '#C8860A', color: 'white',
                  padding: '2px 8px', borderRadius: '12px',
                  fontSize: '10px', fontWeight: '600', textTransform: 'uppercase'
                }}>
                  {role === 'super_admin' ? 'Admin' :
                   role === 'direction' ? 'Direction' :
                   role === 'comptabilite' ? 'Compta' : 'Scolarité'}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              style={{
                fontSize: '13px', padding: '8px 12px',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
                backgroundColor: 'transparent', color: '#8FA3B3',
                cursor: 'pointer', width: '100%'
              }}
            >
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  )
}