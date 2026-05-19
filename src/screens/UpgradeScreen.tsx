import React, { useState } from 'react'
import { useThemeStore } from '../store/themeStore'
import { useAuthStore } from '../store/authStore'
import { space, radius, font } from '../styles/theme'

interface Props {
  onClose: () => void
}

const PREMIUM_FEATURES = [
  { icon: '✈', title: 'All live flights worldwide', desc: 'Access every airborne flight, not just the free pool of 30' },
  { icon: '🎲', title: 'Random flight button', desc: 'Get assigned a random live flight anywhere in the world' },
  { icon: '🛫', title: 'Airport picker', desc: 'Browse live departures from any airport on earth' },
  { icon: '🔗', title: 'Unlimited connecting flights', desc: 'Chain as many flights as you need for long study sessions' },
  { icon: '🗺', title: 'Full passport history', desc: 'Your complete logbook — every flight, every session, forever' },
  { icon: '🔥', title: 'Streak protection', desc: 'One free streak forgiveness per month when life happens' },
  { icon: '💺', title: 'Business & First class', desc: 'Longer Pomodoro intervals designed for deep work' },
]

export default function UpgradeScreen({ onClose }: Props) {
  const { theme }       = useThemeStore()
  const { user }        = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleUpgrade = async () => {
    if (!user) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('http://localhost:3002/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.username }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch (err) {
      setError('Could not connect to payment server. Make sure stripe-server.js is running.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: theme.bgCard,
          borderRadius: `${radius.xl}px ${radius.xl}px 0 0`,
          padding: `${space.xl}px ${space.lg}px`,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: space.xl }}>
          <div style={{ fontSize: 40, marginBottom: space.sm }}>✈</div>
          <div style={{ fontSize: font.xl, fontWeight: 700, color: theme.text, letterSpacing: -0.5 }}>
            Upgrade to Premium
          </div>
          <div style={{ fontSize: font.sm, color: theme.textSecondary, marginTop: space.xs }}>
            Unlock the full FlightFocus experience
          </div>
        </div>

        {/* Price */}
        <div style={{
          background: '#07111F',
          borderRadius: radius.lg,
          padding: space.xl,
          textAlign: 'center',
          marginBottom: space.xl,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
            <span style={{ fontSize: 42, fontWeight: 700, color: '#fff', letterSpacing: -2 }}>$2.99</span>
            <span style={{ fontSize: font.sm, color: 'rgba(255,255,255,0.4)' }}>/month</span>
          </div>
          <div style={{ fontSize: font.xs, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
            Cancel anytime · Billed monthly
          </div>
        </div>

        {/* Features */}
        <div style={{ marginBottom: space.xl }}>
          {PREMIUM_FEATURES.map(f => (
            <div key={f.title} style={{
              display: 'flex', gap: space.md, alignItems: 'flex-start',
              padding: `${space.sm}px 0`,
              borderBottom: `0.5px solid ${theme.border}`,
            }}>
              <div style={{ fontSize: 20, flexShrink: 0, width: 28, textAlign: 'center' }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: font.sm, fontWeight: 600, color: theme.text, marginBottom: 2 }}>{f.title}</div>
                <div style={{ fontSize: font.xs, color: theme.textSecondary }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: theme.bgDanger, color: theme.textDanger, borderRadius: radius.md, padding: `${space.sm}px ${space.md}px`, fontSize: font.xs, marginBottom: space.md, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* CTA */}
        <button onClick={handleUpgrade} disabled={loading} style={{
          width: '100%', padding: 18, borderRadius: radius.lg, border: 'none',
          background: '#185FA5', color: '#fff',
          fontSize: font.md, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          marginBottom: space.sm,
        }}>
          {loading ? 'Redirecting...' : 'Upgrade for $2.99/month ✈'}
        </button>

        <button onClick={onClose} style={{
          width: '100%', padding: 14, borderRadius: radius.lg,
          border: `0.5px solid ${theme.border}`,
          background: 'transparent', color: theme.textTertiary,
          fontSize: font.sm, cursor: 'pointer',
        }}>
          Maybe later
        </button>

        <div style={{ textAlign: 'center', marginTop: space.md, fontSize: 10, color: theme.textTertiary }}>
          Secure payment via Stripe · Cancel anytime in settings
        </div>
      </div>
    </div>
  )
}