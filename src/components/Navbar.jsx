import { useState, useEffect } from 'react'
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

  return (
    <nav style={{
      backgroundColor: '#1e293b',
      borderBottom: '0.5px solid #334155',
      padding: isMobile ? '0 1rem' : '0 1.5rem',
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          backgroundColor: '#0ea5e9', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: '600', color: '#fff'
        }}>UK</div>
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9' }}>UNIKI</span>
      </div>

      {/* Desktop Navigation */}
      {!isMobile && (
        <div style={{ display: 'flex', gap: '2rem' }}>
          <span
            onClick={() => navigate('/dashboard')}
            style={{
              fontSize: '13px', cursor: 'pointer',
              color: location.pathname === '/dashboard' ? '#0ea5e9' : '#94a3b8',
              borderBottom: location.pathname === '/dashboard' ? '2px solid #0ea5e9' : 'none',
              paddingBottom: '2px'
            }}>
            Tableau de bord
          </span>
          <span
            onClick={() => navigate('/etudiants')}
            style={{
              fontSize: '13px', cursor: 'pointer',
              color: location.pathname === '/etudiants' ? '#0ea5e9' : '#94a3b8',
              borderBottom: location.pathname === '/etudiants' ? '2px solid #0ea5e9' : 'none',
              paddingBottom: '2px'
            }}>
            Étudiants
          </span>
          {/* Lien Utilisateurs visible uniquement pour les super_admins */}
          {!roleLoading && role === 'super_admin' && (
            <span
              onClick={() => navigate('/utilisateurs')}
              style={{
                fontSize: '13px', cursor: 'pointer',
                color: location.pathname === '/utilisateurs' ? '#0ea5e9' : '#94a3b8',
                borderBottom: location.pathname === '/utilisateurs' ? '2px solid #0ea5e9' : 'none',
                paddingBottom: '2px'
              }}>
              Utilisateurs
            </span>
          )}
          {/* Lien Journal visible uniquement pour les super_admins */}
          {!roleLoading && role === 'super_admin' && (
            <span
              onClick={() => navigate('/journal')}
              style={{
                fontSize: '13px', cursor: 'pointer',
                color: location.pathname === '/journal' ? '#0ea5e9' : '#94a3b8',
                borderBottom: location.pathname === '/journal' ? '2px solid #0ea5e9' : 'none',
                paddingBottom: '2px'
              }}>
              Journal
            </span>
          )}
        </div>
      )}

      {/* Mobile Hamburger Menu */}
      {isMobile && (
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      )}

      {/* Desktop User Info */}
      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {session?.user?.email}
          </span>
          {!roleLoading && role && (
            <span style={{
              backgroundColor: role === 'super_admin' ? '#dc2626' : 
                             role === 'direction' ? '#7c3aed' :
                             role === 'comptabilite' ? '#0891b2' : '#059669',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: '500',
              textTransform: 'uppercase'
            }}>
              {role === 'super_admin' ? 'Admin' : 
               role === 'direction' ? 'Direction' :
               role === 'comptabilite' ? 'Compta' : 'Scolarité'}
            </span>
          )}
          <button onClick={handleLogout} style={{
            fontSize: '12px', padding: '5px 12px',
            border: '0.5px solid #334155', borderRadius: '8px',
            backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer'
          }}>
            Déconnexion
          </button>
        </div>
      )}

      {/* Mobile Menu Dropdown */}
      {isMobile && menuOpen && (
        <div style={{
          position: 'absolute',
          top: '52px',
          left: 0,
          right: 0,
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
          padding: '1rem',
          zIndex: 99
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <span
              onClick={() => { navigate('/dashboard'); setMenuOpen(false) }}
              style={{
                fontSize: '14px', cursor: 'pointer',
                color: location.pathname === '/dashboard' ? '#0ea5e9' : '#94a3b8',
                padding: '8px 0'
              }}>
              Tableau de bord
            </span>
            <span
              onClick={() => { navigate('/etudiants'); setMenuOpen(false) }}
              style={{
                fontSize: '14px', cursor: 'pointer',
                color: location.pathname === '/etudiants' ? '#0ea5e9' : '#94a3b8',
                padding: '8px 0'
              }}>
              Étudiants
            </span>
            {/* Lien Utilisateurs visible uniquement pour les super_admins */}
            {!roleLoading && role === 'super_admin' && (
              <span
                onClick={() => { navigate('/utilisateurs'); setMenuOpen(false) }}
                style={{
                  fontSize: '14px', cursor: 'pointer',
                  color: location.pathname === '/utilisateurs' ? '#0ea5e9' : '#94a3b8',
                  padding: '8px 0'
                }}>
                Utilisateurs
              </span>
            )}
            {/* Lien Journal visible uniquement pour les super_admins */}
            {!roleLoading && role === 'super_admin' && (
              <span
                onClick={() => { navigate('/journal'); setMenuOpen(false) }}
                style={{
                  fontSize: '14px', cursor: 'pointer',
                  color: location.pathname === '/journal' ? '#0ea5e9' : '#94a3b8',
                  padding: '8px 0'
                }}>
                Journal
              </span>
            )}
            <div style={{ 
              borderTop: '1px solid #334155', 
              paddingTop: '1rem', 
              marginTop: '0.5rem' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {session?.user?.email}
                </span>
                {!roleLoading && role && (
                  <span style={{
                    backgroundColor: role === 'super_admin' ? '#dc2626' : 
                                   role === 'direction' ? '#7c3aed' :
                                   role === 'comptabilite' ? '#0891b2' : '#059669',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '500',
                    textTransform: 'uppercase'
                  }}>
                    {role === 'super_admin' ? 'Admin' : 
                     role === 'direction' ? 'Direction' :
                     role === 'comptabilite' ? 'Compta' : 'Scolarité'}
                  </span>
                )}
              </div>
              <button onClick={handleLogout} style={{
                fontSize: '12px', padding: '8px 12px',
                border: '0.5px solid #334155', borderRadius: '8px',
                backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer',
                width: '100%'
              }}>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
