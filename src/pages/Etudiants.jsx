import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import Navbar from '../components/Navbar'

export default function Etudiants() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [etudiants, setEtudiants] = useState([])
  const [filteredEtudiants, setFilteredEtudiants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('Tous')
  const [printId, setPrintId] = useState('')
  const [isPrinting, setIsPrinting] = useState(false)

  useEffect(() => {
    fetchSession()
    fetchEtudiants()
  }, [])

  useEffect(() => {
    filterEtudiants()
  }, [etudiants, searchTerm, activeFilter])

  const fetchSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setSession(session)
  }

  const fetchEtudiants = async () => {
    try {
      const { data, error } = await supabase
        .from('etudiants')
        .select(`
          *,
          statuts_tranches (
            id,
            statut,
            montant_restant,
            tranches (
              id,
              numero_tranche,
              montant_attendu
            )
          )
        `)
        .order('nom', { ascending: true })

      console.log('data:', data)
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      setEtudiants(data || [])
    } catch (error) {
      console.error('Error fetching etudiants:', error)
      setError(error.message || 'Erreur lors du chargement des étudiants')
    } finally {
      setLoading(false)
    }
  }

  const filterEtudiants = () => {
    // Si aucun filtre actif → retourner tous les etudiants
    if (activeFilter === 'Tous' && !searchTerm) {
      setFilteredEtudiants(etudiants)
      return
    }

    let filtered = [...etudiants]

    // Filtre recherche : etudiant.nom, etudiant.prenom, etudiant.numero_etudiant
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(etudiant => {
        const nom = etudiant.nom?.toLowerCase() || ''
        const prenom = etudiant.prenom?.toLowerCase() || ''
        const numeroEtudiant = etudiant.numero_etudiant?.toLowerCase() || ''
        return nom.includes(term) || prenom.includes(term) || numeroEtudiant.includes(term)
      })
    }

    // Filtre statut : etudiant.statuts_tranches?.[0]?.statut
    if (activeFilter !== 'Tous' && ['Payé', 'Partiel', 'En attente'].includes(activeFilter)) {
      filtered = filtered.filter(etudiant => 
        etudiant.statuts_tranches?.[0]?.statut === activeFilter
      )
    }

    // Filtre tranche : etudiant.statuts_tranches?.[0]?.tranches?.numero_tranche
    if (activeFilter !== 'Tous' && ['Tranche 1', 'Tranche 2', 'Tranche 3'].includes(activeFilter)) {
      const trancheNumber = parseInt(activeFilter.split(' ')[1])
      filtered = filtered.filter(etudiant => 
        etudiant.statuts_tranches?.[0]?.tranches?.numero_tranche === trancheNumber
      )
    }

    setFilteredEtudiants(filtered)
  }

  const handleEtudiantClick = (etudiantId) => {
    navigate(`/etudiant/${etudiantId}`)
  }

  const getStatusBadge = (statut) => {
    if (!statut || statut === 'Non configuré') {
      return (
        <span style={{
          backgroundColor: '#374151',
          color: '#d1d5db',
          padding: '4px 12px',
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: '500',
          display: 'inline-block'
        }}>
          Non configuré
        </span>
      )
    }
    
    const statusConfig = {
      'Payé': { bg: '#d1fae5', color: '#065f46', border: '#10b981' },
      'Partiel': { bg: '#fef3c7', color: '#92400e', border: '#f59e0b' },
      'En attente': { bg: '#fee2e2', color: '#991b1b', border: '#ef4444' }
    }

    const config = statusConfig[statut] || statusConfig['En attente']
    
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
        {statut}
      </span>
    )
  }

  const handlePrint = async () => {
    if (!session) {
      setError('Vous devez être connecté pour imprimer')
      return
    }

    setIsPrinting(true)
    try {
      // a) Générer un ID unique
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
      const generatedPrintId = `UNIKI-${year}-${month}-${random}`
      setPrintId(generatedPrintId)

      // b) Créer le snapshot de la liste visible
      const snapshot = filteredEtudiants.map(etudiant => ({
        nom: etudiant.nom || '',
        prenom: etudiant.prenom || '',
        numero_etudiant: etudiant.numero_etudiant || '',
        filiere: etudiant.filiere || '',
        statut: etudiant.statuts_tranches?.[0]?.statut || 'Non configuré',
        tranche: etudiant.statuts_tranches?.[0]?.tranches ? 
          `Tranche ${etudiant.statuts_tranches[0].tranches.numero_tranche}` : '-',
        montant_restant: etudiant.statuts_tranches?.[0]?.montant_restant || 0
      }))

      // c) Enregistrer dans Supabase
      const { error: logError } = await supabase
        .from('print_logs')
        .insert({
          id: generatedPrintId,
          printed_by: session.user?.email,
          filtre_statut: ['Payé', 'Partiel', 'En attente'].includes(activeFilter) ? activeFilter : null,
          filtre_tranche: ['Tranche 1', 'Tranche 2', 'Tranche 3'].includes(activeFilter) ? activeFilter : null,
          recherche: searchTerm || null,
          nombre_etudiants: filteredEtudiants.length,
          liste_snapshot: snapshot
        })

      if (logError) {
        console.error('Error logging print:', logError)
        throw logError
      }

      // d) Déclencher l'impression après un court délai pour que le QR code s'affiche
      setTimeout(() => {
        window.print()
        setIsPrinting(false)
      }, 500)

    } catch (error) {
      console.error('Error during print:', error)
      setError('Erreur lors de la préparation de l\'impression')
      setIsPrinting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <div style={{ color: '#0ea5e9', fontSize: '18px' }}>Chargement...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <div style={{ color: '#ef4444', fontSize: '16px', textAlign: 'center', padding: '20px' }}>{error}</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}>
      <Navbar session={session} />
      <div style={{ padding: '1.5rem' }}>
        <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '600', marginBottom: '32px' }}>Liste des étudiants</h1>
        
        {/* Carte de recherche et filtres */}
        <div className="search-card" style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Rechercher par nom, prénom ou numéro étudiant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                maxWidth: '400px',
                padding: '12px 16px',
                backgroundColor: '#0f172a',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                marginRight: '16px'
              }}
            />
            <button
              onClick={handlePrint}
              className="btn-print"
              disabled={isPrinting}
              style={{
                backgroundColor: isPrinting ? '#374151' : '#0ea5e9',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isPrinting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {
                if (!isPrinting) e.target.style.backgroundColor = '#0284c7'
              }}
              onMouseOut={(e) => {
                if (!isPrinting) e.target.style.backgroundColor = '#0ea5e9'
              }}
            >
              {isPrinting ? 'Préparation...' : 'Imprimer la liste'}
            </button>
          </div>
          
          {/* Pills de filtre */}
          <div className="filter-pills" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['Tous', 'Payé', 'Partiel', 'En attente', 'Tranche 1', 'Tranche 2', 'Tranche 3'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                style={{
                  backgroundColor: activeFilter === filter ? '#0ea5e9' : '#374151',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => {
                  if (activeFilter !== filter) e.target.style.backgroundColor = '#4b5563'
                }}
                onMouseOut={(e) => {
                  if (activeFilter !== filter) e.target.style.backgroundColor = '#374151'
                }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Carte du tableau */}
        <div className="table-card" style={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
          {/* Compteur de résultats */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: 0 }}>Résultats</h2>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>
              {filteredEtudiants.length} résultat{filteredEtudiants.length !== 1 ? 's' : ''} — mis à jour automatiquement
            </div>
          </div>

          {/* Tableau */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#374151' }}>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>NOM</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PRÉNOM</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>N° ÉTUDIANT</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>FILIÈRE</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TRANCHE</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MONTANT DÛ</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>STATUT</th>
                </tr>
              </thead>
              <tbody>
                {filteredEtudiants.map((etudiant, index) => (
                  <tr 
                    key={etudiant.id} 
                    onClick={() => handleEtudiantClick(etudiant.id)}
                    style={{
                      borderBottom: '1px solid #334155',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#374151'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <td style={{ padding: '16px', color: 'white', fontSize: '14px' }}>
                      {etudiant.nom || '-'}
                    </td>
                    <td style={{ padding: '16px', color: 'white', fontSize: '14px' }}>
                      {etudiant.prenom || '-'}
                    </td>
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>
                      {etudiant.numero_etudiant || '-'}
                    </td>
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>
                      {etudiant.filiere || '-'}
                    </td>
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>
                      {etudiant.statuts_tranches && etudiant.statuts_tranches.length > 0 
                        ? `Tranche ${etudiant.statuts_tranches[0].tranches?.numero_tranche || 1}`
                        : '-'
                      }
                    </td>
                    <td style={{ padding: '16px', color: 'white', fontSize: '14px', fontWeight: '500' }}>
                      ${etudiant.statuts_tranches && etudiant.statuts_tranches.length > 0
                        ? (etudiant.statuts_tranches[0].montant_restant || 0).toLocaleString()
                        : '0'
                      }
                    </td>
                    <td style={{ padding: '16px' }}>
                      {getStatusBadge(
                        etudiant.statuts_tranches && etudiant.statuts_tranches.length > 0
                          ? etudiant.statuts_tranches[0].statut
                          : 'Non configuré'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEtudiants.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>Aucun étudiant trouvé</div>
              <div style={{ fontSize: '14px' }}>Essayez de modifier vos filtres ou votre recherche</div>
            </div>
          )}
        </div>

        {/* Zone QR code et informations d'impression (visible uniquement à l'impression) */}
        {printId && (
          <div className="qr-print-section" style={{
            display: 'none',
            '@media print': {
              display: 'block'
            }
          }}>
            {/* En-tête d'impression */}
            <div style={{
              textAlign: 'center',
              marginBottom: '20px',
              pageBreakBefore: 'always'
            }}>
              <h1 style={{
                color: '#1f2937',
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                UNIVERSITÉ DE KINDU — Liste officielle des frais académiques
              </h1>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>
                Imprimé le {new Date().toLocaleString('fr-FR')} • {filteredEtudiants.length} étudiants
              </div>
              {(activeFilter !== 'Tous' || searchTerm) && (
                <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
                  Filtres: {activeFilter !== 'Tous' ? activeFilter : ''} {searchTerm ? `• Recherche: "${searchTerm}"` : ''}
                </div>
              )}
            </div>

            {/* QR code et numéro de série */}
            <div style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              textAlign: 'center',
              backgroundColor: 'white',
              padding: '10px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}>
              <QRCodeSVG
                value={`https://uniki-web.vercel.app/verify/${printId}`}
                size={100}
                level="H"
                includeMargin={true}
              />
              <div style={{
                fontSize: '10px',
                color: '#374151',
                marginTop: '8px',
                fontWeight: '600'
              }}>
                {printId}
              </div>
              <div style={{
                fontSize: '8px',
                color: '#6b7280',
                marginTop: '4px',
                maxWidth: '120px'
              }}>
                Vérifiez ce document sur uniki-web.vercel.app/verify/{printId}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
