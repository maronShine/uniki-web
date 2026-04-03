import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: '#1e293b', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '400px', border: '1px solid #334155' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', backgroundColor: '#0ea5e9', borderRadius: '50%', marginBottom: '16px' }}>
            <span style={{ color: 'white', fontWeight: '700', fontSize: '20px' }}>UK</span>
          </div>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Université de Kindu</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Système de suivi des frais académiques</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {error && (
            <div style={{ backgroundColor: '#7f1d1d', border: '1px solid #991b1b', color: '#fecaca', padding: '12px 16px', borderRadius: '8px', fontSize: '14px' }}>
              {error}
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
              placeholder="••••••••"
              required
              onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
              onBlur={(e) => e.target.style.borderColor = '#374151'}
            />
          </div>

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
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}