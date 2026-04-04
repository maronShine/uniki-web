import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Verify() {
  const { printId } = useParams()
  const [printLog, setPrintLog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPrintLog()
  }, [printId])

  const fetchPrintLog = async () => {
    try {
      const { data, error } = await supabase
        .from('print_logs')
        .select('*')
        .eq('id', printId)
        .single()

      if (error) throw error
      setPrintLog(data)
    } catch (error) {
      console.error('Error fetching print log:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'white',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ color: '#374151', fontSize: '18px' }}>Vérification en cours...</div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'white',
      padding: '40px 20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Logo UNIKI */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: '40px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#0ea5e9',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px'
          }}>
            <span style={{
              color: 'white',
              fontWeight: '700',
              fontSize: '18px'
            }}>UK</span>
          </div>
          <span style={{
            color: '#1f2937',
            fontWeight: '600',
            fontSize: '24px'
          }}>UNIKI</span>
        </div>

        {printLog ? (
          // Document trouvé - affichage en vert
          <div style={{ 
            backgroundColor: '#f0fdf4', 
            border: '2px solid #16a34a', 
            borderRadius: '12px', 
            padding: '32px',
            textAlign: 'center'
          }}>
            <div style={{ 
              backgroundColor: '#16a34a', 
              color: 'white', 
              padding: '12px 24px', 
              borderRadius: '8px',
              display: 'inline-block',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '24px'
            }}>
              ✓ Document officiel vérifié
            </div>
            
            <div style={{ textAlign: 'left', color: '#1f2937', fontSize: '16px', lineHeight: '1.6' }}>
              <h1 style={{
                color: '#1f2937',
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                UNIVERSITÉ DE KINDU — Liste officielle des frais académiques
              </h1>
              <div style={{ marginBottom: '16px' }}>
                <strong>Numéro de série :</strong> {printLog.id}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Date d'impression :</strong> {new Date(printLog.created_at).toLocaleString('fr-FR')}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Imprimé par :</strong> {printLog.printed_by}
              </div>
              {printLog.filtre_statut && (
                <div style={{ marginBottom: '16px' }}>
                  <strong>Filtre statut :</strong> {printLog.filtre_statut}
                </div>
              )}
              {printLog.filtre_tranche && (
                <div style={{ marginBottom: '16px' }}>
                  <strong>Filtre tranche :</strong> {printLog.filtre_tranche}
                </div>
              )}
              {printLog.recherche && (
                <div style={{ marginBottom: '16px' }}>
                  <strong>Recherche appliquée :</strong> "{printLog.recherche}"
                </div>
              )}
              <div style={{ marginBottom: '16px' }}>
                <strong>Nombre d'étudiants :</strong> {printLog.nombre_etudiants}
              </div>
            </div>

            {printLog.liste_snapshot && printLog.liste_snapshot.length > 0 && (
              <div style={{ marginTop: '32px' }}>
                <h3 style={{ color: '#1f2937', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                  Liste des étudiants ({printLog.liste_snapshot.length})
                </h3>
                <div style={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#374151', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Nom</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#374151', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Prénom</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#374151', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>N° Étudiant</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#374151', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printLog.liste_snapshot.map((etudiant, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px', color: '#1f2937', fontSize: '14px' }}>{etudiant.nom}</td>
                          <td style={{ padding: '12px', color: '#1f2937', fontSize: '14px' }}>{etudiant.prenom}</td>
                          <td style={{ padding: '12px', color: '#6b7280', fontSize: '14px' }}>{etudiant.numero_etudiant}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              backgroundColor: etudiant.statut === 'Payé' ? '#d1fae5' : 
                                             etudiant.statut === 'Partiel' ? '#fef3c7' : '#fee2e2',
                              color: etudiant.statut === 'Payé' ? '#065f46' : 
                                     etudiant.statut === 'Partiel' ? '#92400e' : '#991b1b',
                              padding: '4px 12px',
                              borderRadius: '16px',
                              fontSize: '12px',
                              fontWeight: '500',
                              display: 'inline-block'
                            }}>
                              {etudiant.statut}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Document non trouvé - affichage en rouge
          <div style={{ 
            backgroundColor: '#fef2f2', 
            border: '2px solid #dc2626', 
            borderRadius: '12px', 
            padding: '32px',
            textAlign: 'center'
          }}>
            <div style={{ 
              backgroundColor: '#dc2626', 
              color: 'white', 
              padding: '12px 24px', 
              borderRadius: '8px',
              display: 'inline-block',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              ✗ Document non reconnu
            </div>
            <div style={{ color: '#dc2626', fontSize: '16px' }}>
              Ce document n'est pas officiel ou n'existe pas dans notre système.
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '12px' }}>
              Veuillez vérifier l'URL ou contacter l'administration de l'Université de Kindu.
            </div>
          </div>
        )}

        {/* Pied de page */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '40px', 
          paddingTop: '20px',
          borderTop: '1px solid #e5e7eb',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          <div>Université de Kindu - Système de suivi des frais académiques</div>
          <div style={{ marginTop: '4px' }}>www.uniki-kindu.edu</div>
        </div>
      </div>
    </div>
  )
}
