import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { useRole } from '../hooks/useRole'
import { useWindowWidth } from '../hooks/useWindowWidth'

export default function JournalModifications({ session }) {
  const { role, loading: roleLoading } = useRole(session)
  const width = useWindowWidth()
  const isMobile = width < 768
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('Tous')
  const [showDetails, setShowDetails] = useState(null)

  useEffect(() => {
    if (!roleLoading && role === 'super_admin') {
      fetchLogs()
    }
  }, [role, roleLoading])

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error fetching logs:', error)
      setError('Erreur lors du chargement du journal')
    } finally {
      setLoading(false)
    }
  }

  const getActionBadge = (action) => {
    const actionConfig = {
      'IMPRESSION_LISTE': { bg: '#3b82f6', color: 'white', label: 'Impression' },
      'AJOUT_UTILISATEUR': { bg: '#10b981', color: 'white', label: 'Ajout utilisateur' },
      'MODIFICATION_STATUT': { bg: '#f59e0b', color: 'white', label: 'Modification statut' },
      'CONNEXION': { bg: '#8b5cf6', color: 'white', label: 'Connexion' },
      'SUPPRESSION_UTILISATEUR': { bg: '#ef4444', color: 'white', label: 'Suppression utilisateur' }
    }

    const config = actionConfig[action] || { bg: '#6b7280', color: 'white', label: action }
    
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

  const filteredLogs = logs.filter(log => {
    if (filter === 'Tous') return true
    if (filter === 'Impression') return log.action === 'IMPRESSION_LISTE'
    if (filter === 'Connexion') return log.action === 'CONNEXION'
    if (filter === 'Modification') return log.action === 'MODIFICATION_STATUT'
    if (filter === 'Ajout') return log.action === 'AJOUT_UTILISATEUR'
    if (filter === 'Suppression') return log.action === 'SUPPRESSION_UTILISATEUR'
    return true
  })

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
          Journal des modifications
        </h1>
        
        {/* Filtres */}
        <div style={{ 
          backgroundColor: '#1e293b', 
          padding: '20px', 
          borderRadius: '12px', 
          border: '1px solid #334155',
          marginBottom: '24px'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            flexWrap: 'wrap',
            overflowX: isMobile ? 'auto' : 'visible',
            paddingBottom: isMobile ? '8px' : '0'
          }}>
            {['Tous', 'Impression', 'Connexion', 'Modification', 'Ajout', 'Suppression'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                style={{
                  backgroundColor: filter === filterOption ? '#0ea5e9' : '#374151',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => {
                  if (filter !== filterOption) e.target.style.backgroundColor = '#4b5563'
                }}
                onMouseOut={(e) => {
                  if (filter !== filterOption) e.target.style.backgroundColor = '#374151'
                }}
              >
                {filterOption}
              </button>
            ))}
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

        {/* Tableau des logs */}
        <div style={{ 
          backgroundColor: '#1e293b', 
          borderRadius: '12px', 
          border: '1px solid #334155',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #334155' }}>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: 0 }}>
              Activité récente ({filteredLogs.length} entrées)
            </h2>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#374151' }}>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DATE/HEURE</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ACTION</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TABLE</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MODIFIÉ PAR</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DÉTAILS</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>
                      {new Date(log.created_at).toLocaleString('fr-FR')}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {getActionBadge(log.action)}
                    </td>
                    <td style={{ padding: '16px', color: 'white', fontSize: '14px' }}>
                      {log.table_name || '-'}
                    </td>
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>
                      {log.performed_by || '-'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <button
                        onClick={() => setShowDetails(showDetails === log.id ? null : log.id)}
                        style={{
                          backgroundColor: '#0ea5e9',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#0284c7'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#0ea5e9'}
                      >
                        {showDetails === log.id ? 'Masquer' : 'Voir détails'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Détails déroulants */}
          {showDetails && (
            <div style={{ 
              backgroundColor: '#0f172a', 
              padding: '20px 24px', 
              borderTop: '1px solid #334155' 
            }}>
              {(() => {
                const log = logs.find(l => l.id === showDetails)
                if (!log) return null
                
                return (
                  <div>
                    <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                      Détails de l'action
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
                      {log.old_value && (
                        <div>
                          <h4 style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                            Ancienne valeur
                          </h4>
                          <pre style={{ 
                            backgroundColor: '#1e293b', 
                            color: '#e2e8f0', 
                            padding: '12px', 
                            borderRadius: '8px', 
                            fontSize: '12px',
                            overflow: 'auto',
                            maxHeight: '200px'
                          }}>
                            {JSON.stringify(log.old_value, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.new_value && (
                        <div>
                          <h4 style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                            Nouvelle valeur
                          </h4>
                          <pre style={{ 
                            backgroundColor: '#1e293b', 
                            color: '#e2e8f0', 
                            padding: '12px', 
                            borderRadius: '8px', 
                            fontSize: '12px',
                            overflow: 'auto',
                            maxHeight: '200px'
                          }}>
                            {JSON.stringify(log.new_value, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: '16px', fontSize: '12px', color: '#64748b' }}>
                      ID: {log.id} • IP: {log.ip_address}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
          
          {filteredLogs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>Aucune activité enregistrée</div>
              <div style={{ fontSize: '14px' }}>Les actions importantes apparaîtront ici</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/*
-- À exécuter dans Supabase SQL Editor :
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_value JSONB,
  new_value JSONB,
  performed_by TEXT,
  ip_address TEXT
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lecture_super_admin" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "ecriture_auth" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);
*/
