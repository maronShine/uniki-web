import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Etudiants() {
  const [etudiants, setEtudiants] = useState([])
  const [filteredEtudiants, setFilteredEtudiants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('Tous')

  useEffect(() => {
    fetchEtudiants()
  }, [])

  useEffect(() => {
    filterEtudiants()
  }, [etudiants, searchTerm, activeFilter])

  const fetchEtudiants = async () => {
    try {
      const { data, error } = await supabase
        .from('statuts_tranches')
        .select(`
          *,
          etudiants (
            id,
            nom,
            prenom,
            numero_etudiant,
            filiere,
            niveau
          ),
          tranches (
            id,
            numero_tranche,
            montant_attendu
          )
        `)
        .order('created_at', { ascending: false })

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
    let filtered = [...etudiants]

    // Filtrage par statut/tranche
    if (activeFilter !== 'Tous') {
      if (['Payé', 'Partiel', 'En attente'].includes(activeFilter)) {
        filtered = filtered.filter(etudiant => etudiant.statut === activeFilter)
      } else if (['Tranche 1', 'Tranche 2', 'Tranche 3'].includes(activeFilter)) {
        const trancheNumber = activeFilter.split(' ')[1]
        filtered = filtered.filter(etudiant => etudiant.tranches?.numero_tranche === parseInt(trancheNumber))
      }
    }

    // Filtrage par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(etudiant => {
        const nom = etudiant.etudiants?.nom?.toLowerCase() || ''
        const prenom = etudiant.etudiants?.prenom?.toLowerCase() || ''
        const numeroEtudiant = etudiant.etudiants?.numero_etudiant?.toLowerCase() || ''
        return nom.includes(term) || prenom.includes(term) || numeroEtudiant.includes(term)
      })
    }

    setFilteredEtudiants(filtered)
  }

  const getStatusBadge = (statut) => {
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
        border: `1px solid ${config.border}`,
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

  const handlePrint = () => {
    window.print()
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
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
              style={{
                backgroundColor: '#0ea5e9',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#0284c7'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#0ea5e9'}
            >
              Imprimer la liste
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
                    style={{ 
                      backgroundColor: index % 2 === 0 ? '#1e293b' : '#252f3f',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#1e293b' : '#252f3f'
                    }}
                  >
                    <td style={{ padding: '16px', color: 'white', fontSize: '14px' }}>
                      {etudiant.etudiants?.nom || '-'}
                    </td>
                    <td style={{ padding: '16px', color: 'white', fontSize: '14px' }}>
                      {etudiant.etudiants?.prenom || '-'}
                    </td>
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>
                      {etudiant.etudiants?.numero_etudiant || '-'}
                    </td>
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>
                      {etudiant.etudiants?.filiere || '-'}
                    </td>
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>
                      {etudiant.tranches ? `Tranche ${etudiant.tranches.numero_tranche}` : '-'}
                    </td>
                    <td style={{ padding: '16px', color: 'white', fontSize: '14px', fontWeight: '500' }}>
                      ${etudiant.montant_total?.toLocaleString() || '0'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {getStatusBadge(etudiant.statut)}
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
      </div>
    </div>
  )
}
