import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRole } from '../hooks/useRole'

export default function Navbar({ session }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { role, loading: roleLoading } = useRole(session)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav style={{
      backgroundColor: '#1e293b',
      borderBottom: '0.5px solid #334155',
      padding: '0 1.5rem',
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
      </div>

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
    </nav>
  )
}
