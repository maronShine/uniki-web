import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { useRole } from '../hooks/useRole'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { logAction } from '../lib/audit'

export default function GestionUtilisateurs({ session }) {
  const { role, loading: roleLoading } = useRole(session)
  const width = useWindowWidth()
  const isMobile = width < 768
  const [utilisateurs, setUtilisateurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState('scolarite')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!roleLoading && role === 'super_admin') {
      fetchUtilisateurs()
    }
  }, [role, roleLoading])

  const fetchUtilisateurs = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUtilisateurs(data || [])
    } catch (error) {
      console.error('Error fetching utilisateurs:', error)
      setError('Erreur lors du chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!email.trim()) {
      setError('Veuillez entrer une adresse email')
      return
    }

    try {
      // Vérifier si l'utilisateur existe déjà
      const { data: existingUser } = await supabase
        .from('user_roles')
        .select('*')
        .eq('email', email.trim())
        .single()

      if (existingUser) {
        setError('Cet utilisateur existe déjà')
        return
      }

      // Insérer le nouvel utilisateur
      const { error } = await supabase
        .from('user_roles')
        .insert({
          email: email.trim(),
          role: selectedRole,
          created_by: session?.user?.email
        })

      if (error) throw error

      // Enregistrer l'action dans le journal d'audit
      await logAction({
        action: 'AJOUT_UTILISATEUR',
        table_name: 'user_roles',
        new_value: { 
          email: email.trim(), 
          role: selectedRole 
        },
        performed_by: session?.user?.email
      })

      setMessage('Invitation enregistrée — l\'utilisateur doit créer son compte sur uniki-web.vercel.app/login')
      setEmail('')
      setSelectedRole('scolarite')
      fetchUtilisateurs() // Rafraîchir la liste
    } catch (error) {
      console.error('Error inviting user:', error)
      setError('Erreur lors de l\'invitation')
    }
  }

  const handleDelete = async (userId, userEmail) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${userEmail} ?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', userId)

      if (error) throw error
      setMessage(`Utilisateur ${userEmail} supprimé avec succès`)
      fetchUtilisateurs() // Rafraîchir la liste
    } catch (error) {
      console.error('Error deleting user:', error)
      setError('Erreur lors de la suppression')
    }
  }

  const getRoleBadge = (role) => {
    const roleConfig = {
      'super_admin': { bg: '#dc2626', color: 'white', label: 'Super Admin' },
      'direction': { bg: '#7c3aed', color: 'white', label: 'Direction' },
      'comptabilite': { bg: '#0891b2', color: 'white', label: 'Comptabilité' },
      'scolarite': { bg: '#059669', color: 'white', label: 'Scolarité' }
    }

    const config = roleConfig[role] || roleConfig['scolarite']
    
    return (
      <span style={{
        backgroundColor: config.bg,
        color: config.color,
        padding: '4px 12px',
        borderRadius: '16px',
        fontSize: '12px',
        fontWeight: '500',
        display: 'inline-block'
      }}>
        {config.label}
      </span>
    )
  }

  if (roleLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}>
        <Navbar session={session} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
          <div style={{ color: '#0ea5e9', fontSize: '18px' }}>Chargement...</div>
        </div>
      </div>
    )
  }

  if (role !== 'super_admin') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}>
        <Navbar session={session} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
          <div style={{ 
            backgroundColor: '#1e293b', 
            padding: '48px', 
            borderRadius: '12px', 
            border: '1px solid #334155',
            textAlign: 'center'
          }}>
            <h1 style={{ color: '#ef4444', fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
              Accès refusé
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '16px' }}>
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}>
        <Navbar session={session} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
          <div style={{ color: '#0ea5e9', fontSize: '18px' }}>Chargement...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}>
      <Navbar session={session} />
      <div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
        <h1 style={{ color: 'white', fontSize: isMobile ? '24px' : '28px', fontWeight: '600', marginBottom: '32px' }}>
          Gestion des utilisateurs
        </h1>
        
        {/* Formulaire d'invitation */}
        <div style={{ 
          backgroundColor: '#1e293b', 
          padding: isMobile ? '20px' : '24px', 
          borderRadius: '12px', 
          border: '1px solid #334155',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Inviter un nouvel utilisateur
          </h2>
          
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            alignItems: isMobile ? 'flex-end' : 'flex-end', 
            flexWrap: 'wrap',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <div style={{ flex: 1, minWidth: isMobile ? '100%' : '250px' }}>
              <label style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>
                Email
              </label>
              <input
                type="email"
                placeholder="email@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            
            <div style={{ minWidth: isMobile ? '100%' : '150px' }}>
              <label style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>
                Rôle
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="scolarite">Scolarité</option>
                <option value="direction">Direction</option>
                <option value="comptabilite">Comptabilité</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            
            <button
              onClick={handleInvite}
              style={{
                backgroundColor: '#0ea5e9',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                width: isMobile ? '100%' : 'auto'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#0284c7'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#0ea5e9'}
            >
              Inviter
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ 
            backgroundColor: '#991b1b', 
            color: 'white', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
        
        {message && (
          <div style={{ 
            backgroundColor: '#059669', 
            color: 'white', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {message}
          </div>
        )}

        {/* Liste des utilisateurs */}
        <div style={{ 
          backgroundColor: '#1e293b', 
          borderRadius: '12px', 
          border: '1px solid #334155',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #334155' }}>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: 0 }}>
              Liste des utilisateurs ({utilisateurs.length})
            </h2>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#374151' }}>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>EMAIL</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>RÔLE</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DATE D'AJOUT</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AJOUTÉ PAR</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {utilisateurs.map((utilisateur) => (
                  <tr key={utilisateur.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '16px', color: 'white', fontSize: '14px' }}>
                      {utilisateur.email}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {getRoleBadge(utilisateur.role)}
                    </td>
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>
                      {new Date(utilisateur.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>
                      {utilisateur.created_by || '-'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <button
                        onClick={() => handleDelete(utilisateur.id, utilisateur.email)}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {utilisateurs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>Aucun utilisateur</div>
              <div style={{ fontSize: '14px' }}>Invitez des utilisateurs pour commencer</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/*
-- À exécuter dans Supabase SQL Editor :
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('super_admin', 'scolarite', 'direction', 'comptabilite')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lecture_auth" ON user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "ecriture_super_admin" ON user_roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "suppression_super_admin" ON user_roles FOR DELETE TO authenticated USING (true);
*/
