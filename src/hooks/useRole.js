import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useRole(session) {
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.email) { 
      setLoading(false)
      return
    }
    
    const checkUserRole = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('email', session.user.email)
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error fetching user role:', error)
        }

        if (!data) {
          // Si l'utilisateur n'est PAS dans user_roles → déconnecter automatiquement
          await supabase.auth.signOut()
          console.log('Accès non autorisé - utilisateur déconnecté')
          return
        }

        setRole(data.role)
      } catch (error) {
        console.error('Error in role check:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUserRole()
  }, [session])

  return { role, loading }
}
