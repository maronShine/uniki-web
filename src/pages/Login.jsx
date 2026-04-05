import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useWindowWidth } from '../hooks/useWindowWidth'
import unikiLogo from '../assets/images/uniki_logo.png'
import unikiProfessors from '../assets/images/uniki_professors.jpg'
import unikiCampus from '../assets/images/uniki_campus.jpg'

export default function Login() {
  const width = useWindowWidth()
  const isMobile = width < 768
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isRegisterMode, setIsRegisterMode] = useState(false)

  // Slideshow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => prev === 0 ? 1 : 0)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

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
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Background slideshow */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <img
          src={currentImageIndex === 0 ? unikiProfessors : unikiCampus}
          alt="UNIKI Background"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: 1,
            transition: 'opacity 1.5s ease-in-out'
          }}
        />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          zIndex: 1
        }} />
      </div>

      {/* Login card */}
      <div style={{ 
        position: 'relative',
        zIndex: 2,
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: isMobile ? '20px' : '40px' 
      }}>
        <div style={{ 
          backgroundColor: 'rgba(15, 23, 42, 0.92)', 
          backdropFilter: 'blur(10px)',
          padding: isMobile ? '24px' : '32px', 
          borderRadius: '12px', 
          width: '100%', 
          maxWidth: isMobile ? '100%' : '400px', 
          border: '1px solid rgba(51, 65, 85, 0.6)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            {/* UNIKI Logo */}
            <img
              src={unikiLogo}
              alt="UNIKI Logo"
              style={{
                width: isMobile ? '120px' : '140px',
                height: 'auto',
                marginBottom: '20px',
                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
              }}
            />
            <h1 style={{ color: 'white', fontSize: isMobile ? '20px' : '24px', fontWeight: '700', marginBottom: '8px' }}>Université de Kindu</h1>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Système de suivi des frais académiques</p>
            
            {/* Toggle Login/Inscription */}
            <div style={{ display: 'flex', backgroundColor: '#374151', borderRadius: '8px', padding: '4px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setIsRegisterMode(false)}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  backgroundColor: !isRegisterMode ? '#1a56db' : 'transparent',
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
                  backgroundColor: isRegisterMode ? '#1a56db' : 'transparent',
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
                onFocus={(e) => e.target.style.borderColor = '#1a56db'}
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
                onFocus={(e) => e.target.style.borderColor = '#1a56db'}
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
                  onFocus={(e) => e.target.style.borderColor = '#1a56db'}
                  onBlur={(e) => e.target.style.borderColor = '#374151'}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: loading ? '#374151' : '#1a56db',
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
                if (!loading) e.target.style.backgroundColor = '#1e40af'
              }}
              onMouseOut={(e) => {
                if (!loading) e.target.style.backgroundColor = '#1a56db'
              }}
            >
              {loading ? (isRegisterMode ? 'Création...' : 'Connexion...') : (isRegisterMode ? 'Créer mon compte' : 'Se connecter')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}