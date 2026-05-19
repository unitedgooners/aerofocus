import React, { useState, useEffect } from 'react'
import { useThemeStore } from '../store/themeStore'
import { space, radius, font } from '../styles/theme'
import { supabase } from '../api/supabase'

interface Props {
  onDone: () => void
}

export default function ResetPasswordScreen({ onDone }: Props) {
  const { theme }               = useThemeStore()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [done, setDone]         = useState(false)
  const [validSession, setValidSession] = useState(false)

  // Check for valid reset session from URL hash
  useEffect(() => {
    const hash   = window.location.hash
    const params = new URLSearchParams(hash.replace('#', '?'))
    const type   = params.get('type')
    const token  = params.get('access_token')

    if (type === 'recovery' && token) {
      // Set the session from the reset link
      supabase.auth.setSession({
        access_token:  token,
        refresh_token: params.get('refresh_token') ?? '',
      }).then(() => setValidSession(true))
    } else {
      setError('Invalid or expired reset link. Please request a new one.')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6)  { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setDone(true)
      // Clear the hash from the URL
      window.history.replaceState(null, '', window.location.pathname)
    }
    setLoading(false)
  }

  if (done) return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: space.lg }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: space.lg }}>✅</div>
        <div style={{ fontSize: font.xl, fontWeight: 700, color: theme.text, marginBottom: space.sm, letterSpacing: -0.5 }}>
          Password updated
        </div>
        <div style={{ fontSize: font.sm, color: theme.textSecondary, marginBottom: space.xl }}>
          Your password has been changed successfully.
        </div>
        <button onClick={onDone} style={{
          width: '100%', padding: 15, borderRadius: radius.md, border: 'none',
          background: theme.bgPrimary, color: '#fff', fontSize: font.md, fontWeight: 600, cursor: 'pointer',
        }}>
          Back to log in
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: space.lg }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 44, marginBottom: space.sm }}>✈</div>
          <div style={{ fontSize: font.xl, fontWeight: 700, color: theme.text, letterSpacing: -0.5 }}>
            Set new password
          </div>
          <div style={{ fontSize: font.sm, color: theme.textSecondary, marginTop: space.xs }}>
            Choose a new password for your account
          </div>
        </div>

        <div style={{ background: theme.bgCard, borderRadius: radius.xl, border: `0.5px solid ${theme.border}`, padding: space.xl }}>

          {error && (
            <div style={{ background: theme.bgDanger, color: theme.textDanger, borderRadius: radius.md, padding: `${space.sm}px ${space.md}px`, fontSize: font.xs, marginBottom: space.md, textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
            <div>
              <label style={{ fontSize: font.xs, fontWeight: 600, color: theme.textTertiary, letterSpacing: 0.5, display: 'block', marginBottom: space.xs }}>
                NEW PASSWORD
              </label>
              <input
                type="password" placeholder="••••••••" value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required minLength={6} disabled={!validSession}
                style={{ width: '100%', padding: '13px 14px', borderRadius: radius.md, border: `0.5px solid ${theme.borderMed}`, background: theme.bgInput, color: theme.text, fontSize: font.md, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: font.xs, fontWeight: 600, color: theme.textTertiary, letterSpacing: 0.5, display: 'block', marginBottom: space.xs }}>
                CONFIRM PASSWORD
              </label>
              <input
                type="password" placeholder="••••••••" value={confirm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
                required minLength={6} disabled={!validSession}
                style={{ width: '100%', padding: '13px 14px', borderRadius: radius.md, border: `0.5px solid ${theme.borderMed}`, background: theme.bgInput, color: theme.text, fontSize: font.md, outline: 'none' }}
              />
              <div style={{ fontSize: 10, color: theme.textTertiary, marginTop: 4 }}>Minimum 6 characters</div>
            </div>

            <button
              type="submit"
              disabled={loading || !validSession}
              style={{
                width: '100%', padding: 15, marginTop: space.xs,
                borderRadius: radius.md, border: 'none',
                background: theme.bgPrimary, color: '#fff',
                fontSize: font.md, fontWeight: 600,
                cursor: loading || !validSession ? 'not-allowed' : 'pointer',
                opacity: loading || !validSession ? 0.7 : 1,
              }}
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: space.lg }}>
          <button onClick={onDone} style={{
            background: 'none', border: 'none',
            color: theme.textAccent, fontSize: font.xs,
            cursor: 'pointer', fontWeight: 600,
          }}>
            ← Back to log in
          </button>
        </div>

      </div>
    </div>
  )
}