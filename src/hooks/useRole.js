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
    
    supabase
      .from('user_roles')
      .select('role')
      .eq('email', session.user.email)
      .single()
      .then(({ data, error }) => {
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error fetching user role:', error)
        }
        setRole(data?.role || 'scolarite') // rôle par défaut
        setLoading(false)
      })
  }, [session])

  return { role, loading }
}
