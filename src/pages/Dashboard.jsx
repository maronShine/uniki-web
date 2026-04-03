import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data, error } = await supabase
        .from('vue_dashboard')
        .select('*')
        .single()

      if (error) throw error
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
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

  const totalEtudiants = dashboardData?.total_etudiants || 0
  const totalCollecte = dashboardData?.total_collecte || 0
  const totalAttendu = dashboardData?.total_attendu || 10000 // Valeur par défaut
  const pourcentageCollecte = totalAttendu > 0 ? (totalCollecte / totalAttendu) * 100 : 0
  const paiementsComplets = dashboardData?.paiements_complets || 0
  const pourcentageComplets = totalEtudiants > 0 ? (paiementsComplets / totalEtudiants) * 100 : 0
  const enAttente = dashboardData?.en_attente || 0
  const partiels = dashboardData?.partiels || 0
  const totalNonComplets = enAttente + partiels
  const pourcentageNonComplets = totalEtudiants > 0 ? (totalNonComplets / totalEtudiants) * 100 : 0

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '600', marginBottom: '32px' }}>Tableau de bord</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
          {/* KPI 1: Total étudiants */}
          <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
            <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Total étudiants</div>
            <div style={{ color: 'white', fontSize: '32px', fontWeight: '700' }}>{totalEtudiants.toLocaleString()}</div>
          </div>

          {/* KPI 2: Total collecté avec barre de progression */}
          <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
            <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Total collecté</div>
            <div style={{ color: 'white', fontSize: '32px', fontWeight: '700', marginBottom: '12px' }}>${totalCollecte.toLocaleString()}</div>
            <div style={{ backgroundColor: '#374151', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#0ea5e9', height: '100%', width: `${Math.min(pourcentageCollecte, 100)}%`, transition: 'width 0.3s ease' }}></div>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '6px' }}>
              ${totalCollecte.toLocaleString()} / ${totalAttendu.toLocaleString()} ({pourcentageCollecte.toFixed(1)}%)
            </div>
          </div>

          {/* KPI 3: Paiements complets */}
          <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', marginRight: '8px' }}></div>
              <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>Paiements complets</div>
            </div>
            <div style={{ color: 'white', fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>{paiementsComplets.toLocaleString()}</div>
            <div style={{ color: '#10b981', fontSize: '14px', fontWeight: '500' }}>{pourcentageComplets.toFixed(1)}%</div>
          </div>

          {/* KPI 4: En attente / Partiels */}
          <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', marginRight: '8px' }}></div>
              <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>En attente / Partiels</div>
            </div>
            <div style={{ color: 'white', fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>{totalNonComplets.toLocaleString()}</div>
            <div style={{ color: '#ef4444', fontSize: '14px', fontWeight: '500' }}>{pourcentageNonComplets.toFixed(1)}%</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#1e293b', padding: '32px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Aperçu des paiements</h2>
          <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
            Bienvenue dans le système de suivi des frais académiques de l'Université de Kindu. 
            Utilisez le menu de navigation pour accéder à la liste complète des étudiants et suivre les paiements en temps réel.
          </p>
        </div>
      </div>
    </div>
  )
}
