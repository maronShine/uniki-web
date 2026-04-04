import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [session, setSession] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chartData, setChartData] = useState({
    paymentStatus: [],
    filiereData: [],
    trancheData: []
  })

  useEffect(() => {
    fetchSession()
    fetchDashboardData()
    fetchChartData()
  }, [])

  const fetchSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setSession(session)
  }

  const fetchChartData = async () => {
    try {
      // Graphique 1: Statuts de paiement
      const { data: statusData, error: statusError } = await supabase
        .from('statuts_tranches')
        .select('statut')

      // Graphique 2: Étudiants par filière
      const { data: filiereData, error: filiereError } = await supabase
        .from('etudiants')
        .select('filiere')

      // Graphique 3: Paiements par tranche
      const { data: trancheData, error: trancheError } = await supabase
        .from('statuts_tranches')
        .select('montant_total, tranches(numero_tranche)')

      if (statusError || filiereError || trancheError) {
        console.error('Error fetching chart data:', { statusError, filiereError, trancheError })
        return
      }

      // Traiter les données pour le graphique 1
      const statusCounts = statusData?.reduce((acc, item) => {
        acc[item.statut] = (acc[item.statut] || 0) + 1
        return acc
      }, {})

      const paymentStatusData = [
        { name: 'Payé', value: statusCounts['Payé'] || 0, color: '#10b981' },
        { name: 'Partiel', value: statusCounts['Partiel'] || 0, color: '#f59e0b' },
        { name: 'En attente', value: statusCounts['En attente'] || 0, color: '#ef4444' }
      ]

      // Traiter les données pour le graphique 2
      const filiereCounts = filiereData?.reduce((acc, item) => {
        acc[item.filiere] = (acc[item.filiere] || 0) + 1
        return acc
      }, {})

      const filiereChartData = Object.entries(filiereCounts).map(([filiere, count]) => ({
        filiere,
        count
      }))

      // Traiter les données pour le graphique 3
      const trancheCounts = trancheData?.reduce((acc, item) => {
        const trancheName = `Tranche ${item.tranches?.numero_tranche || 1}`
        acc[trancheName] = (acc[trancheName] || 0) + (item.montant_total || 0)
        return acc
      }, {})

      const trancheChartData = [
        { name: 'Tranche 1', montant: trancheCounts['Tranche 1'] || 0 },
        { name: 'Tranche 2', montant: trancheCounts['Tranche 2'] || 0 },
        { name: 'Tranche 3', montant: trancheCounts['Tranche 3'] || 0 }
      ]

      setChartData({
        paymentStatus: paymentStatusData,
        filiereData: filiereChartData,
        trancheData: trancheChartData
      })
    } catch (error) {
      console.error('Error fetching chart data:', error)
    }
  }

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
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}>
      <Navbar session={session} />
      <div style={{ padding: '1.5rem' }}>
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

        {/* Graphiques */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
          {/* Graphique 1: Taux de paiement par statut */}
          <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h3 style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Répartition des paiements</h3>
            {chartData.paymentStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData.paymentStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.paymentStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Legend 
                    verticalAlign="middle" 
                    align="right" 
                    layout="vertical"
                    wrapperStyle={{ color: '#f1f5f9', fontSize: '12px' }}
                    formatter={(value, entry) => [`${value} (${((value / chartData.paymentStatus.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%)`, entry.name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '14px' }}>
                En attente des données
              </div>
            )}
          </div>

          {/* Graphique 2: Étudiants par filière */}
          <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h3 style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Étudiants par filière</h3>
            {chartData.filiereData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData.filiereData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#64748b" fontSize="12px" />
                  <YAxis dataKey="filiere" type="category" stroke="#64748b" fontSize="12px" width={80} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '14px' }}>
                En attente des données
              </div>
            )}
          </div>
        </div>

        {/* Graphique 3: Paiements par tranche */}
        <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h3 style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Collecte par tranche</h3>
          {chartData.trancheData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.trancheData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" fontSize="12px" />
                <YAxis stroke="#64748b" fontSize="12px" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Montant collecté']}
                />
                <Bar dataKey="montant" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '14px' }}>
              En attente des données
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
