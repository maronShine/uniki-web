import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

export default function FicheEtudiant({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [etudiant, setEtudiant] = useState(null)
  const [paiements, setPaiements] = useState([])
  const [tranches, setTranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchEtudiantData()
  }, [id])

  const fetchEtudiantData = async () => {
    try {
      setLoading(true)
      
      // Récupérer les informations de l'étudiant
      const { data: etudiantData, error: etudiantError } = await supabase
        .from('etudiants')
        .select('*')
        .eq('id', id)
        .single()

      if (etudiantError) throw etudiantError

      // Récupérer les paiements
      const { data: paiementsData, error: paiementsError } = await supabase
        .from('paiements')
        .select('*')
        .eq('etudiant_id', id)
        .order('date_paiement', { ascending: false })

      if (paiementsError) throw paiementsError

      // Récupérer les tranches
      const { data: tranchesData, error: tranchesError } = await supabase
        .from('statuts_tranches')
        .select('*, tranches(*)')
        .eq('etudiant_id', id)

      if (tranchesError) throw tranchesError

      setEtudiant(etudiantData)
      setPaiements(paiementsData || [])
      setTranches(tranchesData || [])
    } catch (error) {
      console.error('Error fetching etudiant data:', error)
      setError('Erreur lors du chargement des données de l\'étudiant')
    } finally {
      setLoading(false)
    }
  }

  const getStatutGlobal = () => {
    if (tranches.length === 0) return { statut: 'Non configuré', color: '#6b7280' }
    
    const tousPayes = tranches.every(tranche => tranche.statut === 'Payé')
    const unAuMoinsPartiel = tranches.some(tranche => tranche.statut === 'Partiel')
    
    if (tousPayes) return { statut: 'Payé', color: '#10b981' }
    if (unAuMoinsPartiel) return { statut: 'Partiel', color: '#f59e0b' }
    return { statut: 'En attente', color: '#ef4444' }
  }

  const getStatusBadge = (statut, color) => (
    <span style={{
      backgroundColor: color === '#10b981' ? '#d1fae5' : 
                     color === '#f59e0b' ? '#fef3c7' : '#fee2e2',
      color: color === '#10b981' ? '#065f46' : 
             color === '#f59e0b' ? '#92400e' : '#991b1b',
      padding: '4px 12px',
      borderRadius: '16px',
      fontSize: '12px',
      fontWeight: '500',
      display: 'inline-block'
    }}>
      {statut}
    </span>
  )

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

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}>
        <Navbar session={session} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
          <div style={{ color: '#ef4444', fontSize: '16px', textAlign: 'center', padding: '20px' }}>{error}</div>
        </div>
      </div>
    )
  }

  const statutGlobal = getStatutGlobal()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}>
      <Navbar session={session} />
      <div style={{ padding: '1.5rem' }}>
        {/* Bouton retour */}
        <button
          onClick={() => navigate('/etudiants')}
          style={{
            backgroundColor: 'transparent',
            color: '#94a3b8',
            border: '1px solid #374151',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#374151'
            e.target.style.color = '#f1f5f9'
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent'
            e.target.style.color = '#94a3b8'
          }}
        >
          ← Retour à la liste
        </button>

        {/* En-tête étudiant */}
        <div style={{ 
          backgroundColor: '#1e293b', 
          padding: '32px', 
          borderRadius: '12px', 
          border: '1px solid #334155',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
                {etudiant?.nom} {etudiant?.prenom}
              </h1>
              <div style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '4px' }}>
                N° {etudiant?.numero_etudiant}
              </div>
              <div style={{ color: '#64748b', fontSize: '14px' }}>
                {etudiant?.filiere} • {etudiant?.niveau} • {etudiant?.annee_academique}
              </div>
            </div>
            <div>
              {getStatusBadge(statutGlobal.statut, statutGlobal.color)}
            </div>
          </div>
        </div>

        {/* Section Historique des paiements */}
        <div style={{ 
          backgroundColor: '#1e293b', 
          padding: '24px', 
          borderRadius: '12px', 
          border: '1px solid #334155',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Historique des paiements
          </h2>
          {paiements.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>Référence bancaire</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>Montant payé</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>Source email</th>
                  </tr>
                </thead>
                <tbody>
                  {paiements.map((paiement, index) => (
                    <tr key={paiement.id} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '12px', color: '#f1f5f9', fontSize: '14px' }}>
                        {new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={{ padding: '12px', color: '#94a3b8', fontSize: '14px' }}>
                        {paiement.reference_bancaire || '-'}
                      </td>
                      <td style={{ padding: '12px', color: 'white', fontSize: '14px', fontWeight: '500' }}>
                        ${paiement.montant_paye?.toLocaleString() || '0'}
                      </td>
                      <td style={{ padding: '12px', color: '#94a3b8', fontSize: '14px' }}>
                        {paiement.source_email || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#64748b', 
              fontSize: '14px',
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              border: '1px solid #334155'
            }}>
              Aucun paiement enregistré
            </div>
          )}
        </div>

        {/* Section Tranches */}
        <div style={{ 
          backgroundColor: '#1e293b', 
          padding: '24px', 
          borderRadius: '12px', 
          border: '1px solid #334155'
        }}>
          <h2 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Tranches
          </h2>
          {tranches.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>Tranche</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>Montant attendu</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>Montant payé</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>Montant restant</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {tranches.map((tranche, index) => {
                    const montantRestant = (tranche.montant_attendu || 0) - (tranche.montant_paye || 0)
                    return (
                      <tr key={tranche.id} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '12px', color: '#f1f5f9', fontSize: '14px' }}>
                          Tranche {tranche.tranches?.numero_tranche || index + 1}
                        </td>
                        <td style={{ padding: '12px', color: '#94a3b8', fontSize: '14px' }}>
                          ${tranche.montant_attendu?.toLocaleString() || '0'}
                        </td>
                        <td style={{ padding: '12px', color: 'white', fontSize: '14px', fontWeight: '500' }}>
                          ${tranche.montant_paye?.toLocaleString() || '0'}
                        </td>
                        <td style={{ padding: '12px', color: montantRestant > 0 ? '#ef4444' : '#10b981', fontSize: '14px', fontWeight: '500' }}>
                          ${montantRestant.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {getStatusBadge(tranche.statut, 
                            tranche.statut === 'Payé' ? '#10b981' : 
                            tranche.statut === 'Partiel' ? '#f59e0b' : '#ef4444'
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#64748b', 
              fontSize: '14px',
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              border: '1px solid #334155'
            }}>
              Aucune tranche configurée
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
