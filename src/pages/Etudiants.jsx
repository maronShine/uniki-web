import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import Navbar from '../components/Navbar'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { logAction } from '../lib/audit'

export default function Etudiants() {
  const navigate = useNavigate()
  const width = useWindowWidth()
  const isMobile = width < 768
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
    const statusConfig = {
      'Payé': { bg: '#E8F5EE', color: '#1A6B3C', label: 'Payé' },
      'Partiel': { bg: '#FFF4E0', color: '#8A5A00', label: 'Partiel' },
      'En attente': { bg: '#FDECEA', color: '#8B1A1A', label: 'En attente' },
      'Non configuré': { bg: '#EEF1F6', color: '#6B7A90', label: 'Non configuré' }
    }
    
    const config = statusConfig[statut] || statusConfig['Non configuré']
    
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

      // Enregistrer l'action dans le journal d'audit
      await logAction({
        action: 'IMPRESSION_LISTE',
        table_name: 'print_logs',
        record_id: generatedPrintId,
        new_value: { 
          nombre_etudiants: filteredEtudiants.length, 
          filtre: activeFilter,
          recherche: searchTerm
        },
        performed_by: session?.user?.email
      })

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
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F6F9' }}>
      <Navbar session={session} />
      <div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
        <h1 style={{ color: '#1C2B3A', fontSize: isMobile ? '24px' : '28px', fontWeight: '600', marginBottom: '32px' }}>Liste des étudiants</h1>
        
        {/* Carte de recherche et filtres */}
        <div className="search-card" style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '10px', border: '0.5px solid #DDE3EC', marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '20px',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '16px' : '16px'
          }}>
            <input
              type="text"
              placeholder="Rechercher par nom, prénom ou numéro étudiant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                maxWidth: isMobile ? '100%' : '400px',
                padding: '12px 16px',
                backgroundColor: '#F8FAFB',
                border: '1px solid #DDE3EC',
                borderRadius: '8px',
                color: '#1C2B3A',
                fontSize: '14px',
                outline: 'none',
                marginRight: isMobile ? '0' : '16px'
              }}
            />
            <button
              onClick={handlePrint}
              className="btn-print"
              disabled={isPrinting}
              style={{
                backgroundColor: isPrinting ? '#DDE3EC' : '#C8860A',
                color: 'white',
                border: 'none',
                padding: isMobile ? '12px' : '12px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isPrinting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                minWidth: isMobile ? '48px' : 'auto'
              }}
              onMouseOver={(e) => {
                if (!isPrinting) e.target.style.backgroundColor = '#A06D08'
              }}
              onMouseOut={(e) => {
                if (!isPrinting) e.target.style.backgroundColor = '#C8860A'
              }}
            >
              {isMobile ? '🖨️' : (isPrinting ? 'Préparation...' : 'Imprimer la liste')}
            </button>
          </div>
          
          {/* Pills de filtre */}
          <div className="filter-pills" style={{ 
            display: 'flex', 
            gap: '8px', 
            flexWrap: isMobile ? 'nowrap' : 'wrap',
            overflowX: isMobile ? 'auto' : 'visible',
            paddingBottom: isMobile ? '8px' : '0'
          }}>
            {['Tous', 'Payé', 'Partiel', 'En attente', 'Tranche 1', 'Tranche 2', 'Tranche 3'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                style={{
                  backgroundColor: activeFilter === filter ? '#C8860A' : '#F8FAFB',
                  color: activeFilter === filter ? 'white' : '#6B7A90',
                  border: activeFilter === filter ? '1px solid #C8860A' : '1px solid #DDE3EC',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => {
                  if (activeFilter !== filter) {
                    e.target.style.backgroundColor = '#EEF1F6'
                    e.target.style.borderColor = '#EEF1F6'
                  }
                }}
                onMouseOut={(e) => {
                  if (activeFilter !== filter) {
                    e.target.style.backgroundColor = '#F8FAFB'
                    e.target.style.borderColor = '#DDE3EC'
                  }
                }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ 
            backgroundColor: '#FDECEA', 
            color: '#8B1A1A', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            marginBottom: '16px',
            fontSize: '14px',
            border: '1px solid #FDECEA'
          }}>
            {error}
          </div>
        )}

        {/* Compteur de résultats */}
        <div style={{ color: '#6B7A90', fontSize: '14px', marginBottom: '16px' }}>
          {filteredEtudiants.length} étudiant{filteredEtudiants.length !== 1 ? 's' : ''} trouvé{filteredEtudiants.length !== 1 ? 's' : ''}
        </div>

        {/* Carte du tableau */}
        <div className="table-card" style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', border: '0.5px solid #DDE3EC', overflow: 'hidden' }}>
          {/* Compteur de résultats */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #DDE3EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ color: '#1C2B3A', fontSize: '18px', fontWeight: '600', margin: 0 }}>Résultats</h2>
            <div style={{ color: '#6B7A90', fontSize: '14px' }}>
              {filteredEtudiants.length} étudiant{filteredEtudiants.length !== 1 ? 's' : ''} trouvé{filteredEtudiants.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Tableau */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFB' }}>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#6B7A90', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>NOM</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#6B7A90', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PRÉNOM</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#6B7A90', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>NUMÉRO</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#6B7A90', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>FILIÈRE</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#6B7A90', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TRANCHE</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#6B7A90', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>RESTANT</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#6B7A90', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>STATUT</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#6B7A90', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredEtudiants.map((etudiant, index) => (
                  <tr 
                    key={etudiant.id}
                    onClick={() => handleEtudiantClick(etudiant.id)}
                    style={{ 
                      borderBottom: '1px solid #F0F3F8',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#F8FAFB'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <td style={{ padding: '16px', color: '#1C2B3A', fontSize: '14px' }}>{etudiant.nom}</td>
                    <td style={{ padding: '16px', color: '#1C2B3A', fontSize: '14px' }}>{etudiant.prenom}</td>
                    <td style={{ padding: '16px', color: '#1C2B3A', fontSize: '14px' }}>{etudiant.numero_etudiant}</td>
                    <td style={{ padding: '16px', color: '#1C2B3A', fontSize: '14px' }}>{etudiant.filiere}</td>
                    <td style={{ padding: '16px', color: '#1C2B3A', fontSize: '14px' }}>
                      {etudiant.statuts_tranches?.[0]?.tranches?.numero_tranche || '-'}
                    </td>
                    <td style={{ padding: '16px', color: '#1C2B3A', fontSize: '14px' }}>
                      {etudiant.statuts_tranches?.[0]?.montant_restant !== undefined 
                        ? `${etudiant.statuts_tranches[0].montant_restant.toLocaleString()} $` 
                        : '-'
                      }
                    </td>
                    <td style={{ padding: '16px' }}>
                      {getStatusBadge(etudiant.statuts_tranches?.[0]?.statut)}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEtudiantClick(etudiant.id)
                        }}
                        style={{
                          backgroundColor: '#C8860A',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor = '#A06D08'
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor = '#C8860A'
                        }}
                      >
                        Voir
                      </button>
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
