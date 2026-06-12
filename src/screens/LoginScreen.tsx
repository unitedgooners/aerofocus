import React, { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { space, radius, font } from '../styles/theme'

interface Props { onSuccess: () => void }

export default function LoginScreen({ onSuccess }: Props) {
  // ── All state at the top ───────────────────────────────────────────────────
  const [isSignup, setIsSignup]        = useState(false)
  const [email, setEmail]              = useState('')
  const [password, setPassword]        = useState('')
  const [username, setUsername]        = useState('')
  const [referralCode, setReferralCode] = useState(() => {
    // Pick up ?ref=CODE from the URL if present
    const params = new URLSearchParams(window.location.search)
    return params.get('ref')?.toUpperCase() ?? ''
  })
  const [awaitingConfirm, setAwaiting] = useState(false)
  const [resetSent, setResetSent]      = useState(false)
  const [showReset, setShowReset]      = useState(false)

  // ── All hooks at the top — before any conditional returns ─────────────────
  const { login, signup, resetPassword, isLoading, error, clearError } = useAuthStore()
  const { theme } = useThemeStore()

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSignup) {
      await signup(email, password, username, referralCode)
      if (!useAuthStore.getState().error) setAwaiting(true)
    } else {
      await login(email, password)
      if (!useAuthStore.getState().error) onSuccess()
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    await resetPassword(email)
    setResetSent(true)
  }

  const switchMode = () => {
    setIsSignup(v => !v)
    setAwaiting(false)
    clearError()
    setEmail('')
    setPassword('')
    setUsername('')
  }

  // ── Awaiting email confirmation ────────────────────────────────────────────
  if (awaitingConfirm) return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: space.lg }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: space.lg }}>📬</div>
        <div style={{ fontSize: font.xl, fontWeight: 700, color: theme.text, marginBottom: space.sm, letterSpacing: -0.5 }}>
          Check your email
        </div>
        <div style={{ fontSize: font.sm, color: theme.textSecondary, marginBottom: space.xl, lineHeight: 1.6 }}>
          We sent a confirmation link to<br />
          <strong style={{ color: theme.text }}>{email}</strong>
        </div>
        <div style={{ background: theme.bgCard, borderRadius: radius.lg, border: `0.5px solid ${theme.border}`, padding: space.xl, marginBottom: space.xl }}>
          <div style={{ fontSize: font.xs, color: theme.textTertiary, marginBottom: space.md }}>AFTER CONFIRMING YOUR EMAIL</div>
          <div style={{ fontSize: font.sm, color: theme.textSecondary, lineHeight: 1.8 }}>
            1. Click the link in your email<br />
            2. Come back here and log in<br />
            3. Start studying at 38,000 feet ✈
          </div>
        </div>
        <button onClick={() => { setAwaiting(false); setIsSignup(false) }} style={{
          width: '100%', padding: 15, borderRadius: radius.md, border: 'none',
          background: theme.bgPrimary, color: '#fff', fontSize: font.md, fontWeight: 600, cursor: 'pointer',
        }}>
          Go to log in
        </button>
        <div style={{ marginTop: space.md, fontSize: font.xs, color: theme.textTertiary }}>
          Didn't get it? Check your spam folder.
        </div>
      </div>
    </div>
  )

  // ── Password reset sent ────────────────────────────────────────────────────
  if (resetSent) return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: space.lg }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: space.lg }}>📧</div>
        <div style={{ fontSize: font.xl, fontWeight: 700, color: theme.text, marginBottom: space.sm, letterSpacing: -0.5 }}>
          Check your email
        </div>
        <div style={{ fontSize: font.sm, color: theme.textSecondary, marginBottom: space.xl, lineHeight: 1.6 }}>
          We sent a password reset link to<br />
          <strong style={{ color: theme.text }}>{email}</strong>
        </div>
        <button onClick={() => { setResetSent(false); setShowReset(false) }} style={{
          width: '100%', padding: 15, borderRadius: radius.md, border: 'none',
          background: theme.bgPrimary, color: '#fff', fontSize: font.md, fontWeight: 600, cursor: 'pointer',
        }}>
          Back to log in
        </button>
      </div>
    </div>
  )

  // ── Forgot password screen ─────────────────────────────────────────────────
  if (showReset) return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: space.lg }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 44, marginBottom: space.sm }}>✈</div>
          <div style={{ fontSize: font.xl, fontWeight: 700, color: theme.text, letterSpacing: -0.5 }}>Reset password</div>
          <div style={{ fontSize: font.sm, color: theme.textSecondary, marginTop: space.xs }}>We'll send a reset link to your email</div>
        </div>
        <div style={{ background: theme.bgCard, borderRadius: radius.xl, border: `0.5px solid ${theme.border}`, padding: space.xl }}>
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
            <div>
              <label style={{ fontSize: font.xs, fontWeight: 600, color: theme.textTertiary, letterSpacing: 0.5, display: 'block', marginBottom: space.xs }}>EMAIL</label>
              <input
                type="email" placeholder="you@example.com" value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '13px 14px', borderRadius: radius.md, border: `0.5px solid ${theme.borderMed}`, background: theme.bgInput, color: theme.text, fontSize: font.md, outline: 'none' }}
              />
            </div>
            <button type="submit" disabled={isLoading} style={{
              width: '100%', padding: 15, borderRadius: radius.md, border: 'none',
              background: theme.bgPrimary, color: '#fff', fontSize: font.md, fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1,
            }}>
              {isLoading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        </div>
        <div style={{ textAlign: 'center', marginTop: space.lg }}>
          <button onClick={() => setShowReset(false)} style={{
            background: 'none', border: 'none', color: theme.textAccent,
            fontSize: font.xs, cursor: 'pointer', fontWeight: 600,
          }}>
            ← Back to log in
          </button>
        </div>
      </div>
    </div>
  )

  // ── Main login / signup form ───────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: theme.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: space.lg, transition: 'background 0.6s ease',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 44, marginBottom: space.sm }}>✈</div>
          <div style={{ fontSize: font.xl, fontWeight: 700, color: theme.text, letterSpacing: -0.5 }}>FlightFocus</div>
          <div style={{ fontSize: font.sm, color: theme.textSecondary, marginTop: space.xs }}>Study at 38,000 feet</div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', background: theme.bgCardAlt,
          borderRadius: radius.lg, padding: 4, marginBottom: space.lg,
          border: `0.5px solid ${theme.border}`,
        }}>
          {['Log in', 'Sign up'].map((label, i) => {
            const active = isSignup === (i === 1)
            return (
              <button key={label} onClick={() => { setIsSignup(i === 1); clearError() }} style={{
                flex: 1, padding: '10px', borderRadius: radius.md, border: 'none',
                background: active ? theme.bgCard : 'transparent',
                color: active ? theme.text : theme.textTertiary,
                fontSize: font.sm, fontWeight: active ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {label}
              </button>
            )
          })}
        </div>

        {/* Form card */}
        <div style={{ background: theme.bgCard, borderRadius: radius.xl, border: `0.5px solid ${theme.border}`, padding: space.xl }}>
          {error && (
            <div style={{
              background: theme.bgDanger, color: theme.textDanger,
              borderRadius: radius.md, padding: `${space.sm}px ${space.md}px`,
              fontSize: font.xs, marginBottom: space.md, textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>

            {isSignup && (
              <div>
                <label style={{ fontSize: font.xs, fontWeight: 600, color: theme.textTertiary, letterSpacing: 0.5, display: 'block', marginBottom: space.xs }}>USERNAME</label>
                <input
                  type="text" placeholder="aviator_sam" value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                  required={isSignup}
                  style={{ width: '100%', padding: '13px 14px', borderRadius: radius.md, border: `0.5px solid ${theme.borderMed}`, background: theme.bgInput, color: theme.text, fontSize: font.md, outline: 'none' }}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: font.xs, fontWeight: 600, color: theme.textTertiary, letterSpacing: 0.5, display: 'block', marginBottom: space.xs }}>EMAIL</label>
              <input
                type="email" placeholder="you@example.com" value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '13px 14px', borderRadius: radius.md, border: `0.5px solid ${theme.borderMed}`, background: theme.bgInput, color: theme.text, fontSize: font.md, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: font.xs, fontWeight: 600, color: theme.textTertiary, letterSpacing: 0.5, display: 'block', marginBottom: space.xs }}>PASSWORD</label>
              <input
                type="password" placeholder="••••••••" value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required minLength={6}
                style={{ width: '100%', padding: '13px 14px', borderRadius: radius.md, border: `0.5px solid ${theme.borderMed}`, background: theme.bgInput, color: theme.text, fontSize: font.md, outline: 'none' }}
              />
              {isSignup
                ? <div style={{ fontSize: 10, color: theme.textTertiary, marginTop: 4 }}>Minimum 6 characters</div>
                : <button type="button" onClick={() => setShowReset(true)} style={{ background: 'none', border: 'none', color: theme.textAccent, fontSize: font.xs, cursor: 'pointer', marginTop: 6, padding: 0 }}>
                    Forgot password?
                  </button>
              }
            </div>

            {isSignup && (
              <div>
                <label style={{ fontSize: font.xs, fontWeight: 600, color: theme.textTertiary, letterSpacing: 0.5, display: 'block', marginBottom: space.xs }}>
                  REFERRAL CODE <span style={{ fontWeight: 400, color: theme.textTertiary }}>(optional)</span>
                </label>
                <input
                  type="text" placeholder="ABC123" value={referralCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReferralCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  style={{ width: '100%', padding: '13px 14px', borderRadius: radius.md, border: `0.5px solid ${theme.borderMed}`, background: theme.bgInput, color: theme.text, fontSize: font.md, outline: 'none', letterSpacing: 2, textTransform: 'uppercase' }}
                />
                {referralCode && (
                  <div style={{ fontSize: 10, color: theme.textAccent, marginTop: 4 }}>
                    ✓ Applied — your friend gets credit for inviting you
                  </div>
                )}
              </div>
            )}

            <button type="submit" disabled={isLoading} style={{
              width: '100%', padding: 15, marginTop: space.xs,
              borderRadius: radius.md, border: 'none',
              background: theme.bgPrimary, color: '#fff',
              fontSize: font.md, fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}>
              {isLoading ? 'Loading...' : isSignup ? 'Create account ✈' : 'Board ✈'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: space.lg, fontSize: font.xs, color: theme.textTertiary }}>
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={switchMode} style={{
            background: 'none', border: 'none',
            color: theme.textAccent, fontSize: font.xs,
            cursor: 'pointer', fontWeight: 600,
          }}>
            {isSignup ? 'Log in' : 'Sign up'}
          </button>
        </div>

      </div>
    </div>
  )
}