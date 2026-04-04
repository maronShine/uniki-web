import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useWindowWidth } from '../hooks/useWindowWidth'

export default function Login() {
  const width = useWindowWidth()
  const isMobile = width < 768
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isRegisterMode, setIsRegisterMode] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Vérifier que les mots de passe correspondent
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    try {
      // a) Vérifier que l'email existe dans user_roles
      const { data } = await supabase
        .from('user_roles')
        .select('email, role')
        .eq('email', email.trim().toLowerCase())
        .single()

      if (!data) {
        setError("Accès refusé — votre email n'est pas autorisé. Contactez l'administrateur.")
        setLoading(false)
        return
      }

      // b) Si email autorisé → créer le compte
      const { error } = await supabase.auth.signUp({ 
        email: email.trim(), 
        password 
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess("Compte créé avec succès ! Vous pouvez maintenant vous connecter.")
        // Réinitialiser le formulaire
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        // Passer en mode connexion après 2 secondes
        setTimeout(() => {
          setIsRegisterMode(false)
          setSuccess('')
        }, 2000)
      }
    } catch (error) {
      setError('Erreur lors de la création du compte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '20px' : '40px' }}>
      <div style={{ 
        backgroundColor: '#1e293b', 
        padding: isMobile ? '24px' : '32px', 
        borderRadius: '12px', 
        width: '100%', 
        maxWidth: isMobile ? '100%' : '400px', 
        border: '1px solid #334155' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', backgroundColor: '#0ea5e9', borderRadius: '50%', marginBottom: '16px' }}>
            <span style={{ color: 'white', fontWeight: '700', fontSize: '20px' }}>UK</span>
          </div>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Université de Kindu</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Système de suivi des frais académiques</p>
          
          {/* Toggle Login/Inscription */}
          <div style={{ display: 'flex', backgroundColor: '#374151', borderRadius: '8px', padding: '4px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => setIsRegisterMode(false)}
              style={{
                flex: 1,
                padding: '8px 16px',
                backgroundColor: !isRegisterMode ? '#0ea5e9' : 'transparent',
                color: !isRegisterMode ? 'white' : '#94a3b8',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={() => setIsRegisterMode(true)}
              style={{
                flex: 1,
                padding: '8px 16px',
                backgroundColor: isRegisterMode ? '#0ea5e9' : 'transparent',
                color: isRegisterMode ? 'white' : '#94a3b8',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Créer mon compte
            </button>
          </div>
        </div>

        <form onSubmit={isRegisterMode ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {error && (
            <div style={{ backgroundColor: '#7f1d1d', border: '1px solid #991b1b', color: '#fecaca', padding: '12px 16px', borderRadius: '8px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ backgroundColor: '#065f46', border: '1px solid #047857', color: '#d1fae5', padding: '12px 16px', borderRadius: '8px', fontSize: '14px' }}>
              {success}
            </div>
          )}

          <div>
            <label htmlFor="email" style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#0f172a',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              placeholder="votre@email.com"
              required
              onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
              onBlur={(e) => e.target.style.borderColor = '#374151'}
            />
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#0f172a',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              placeholder="•••••••"
              required
              onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
              onBlur={(e) => e.target.style.borderColor = '#374151'}
            />
          </div>

          {isRegisterMode && (
            <div>
              <label htmlFor="confirmPassword" style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Confirmation mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                placeholder="•••••••"
                required
                onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                onBlur={(e) => e.target.style.borderColor = '#374151'}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: loading ? '#374151' : '#0ea5e9',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => {
              if (!loading) e.target.style.backgroundColor = '#0284c7'
            }}
            onMouseOut={(e) => {
              if (!loading) e.target.style.backgroundColor = '#0ea5e9'
            }}
          >
            {loading ? (isRegisterMode ? 'Création...' : 'Connexion...') : (isRegisterMode ? 'Créer mon compte' : 'Se connecter')}
          </button>
        </form>
      </div>
    </div>
  )
}