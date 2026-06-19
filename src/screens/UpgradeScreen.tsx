import React, { useState } from 'react'
import { useThemeStore } from '../store/themeStore'
import { SERVER_URL } from '../utils/config'
import { useAuthStore } from '../store/authStore'
import { space, radius, font, fontFamily } from '../styles/theme'

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
      const res = await fetch(`${SERVER_URL}/stripe/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email }),
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
      background: 'rgba(8,10,16,0.6)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: theme.bg,
          borderRadius: `${radius.xl}px ${radius.xl}px 0 0`,
          padding: `${space.xl}px ${space.lg}px`,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: theme.border, margin: '0 auto', marginBottom: space.lg }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: space.xl }}>
          <div style={{
            display: 'inline-block', background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
            color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
            padding: '5px 14px', borderRadius: radius.pill, marginBottom: space.md,
          }}>
            FIRST CLASS
          </div>
          <div style={{
            fontFamily: fontFamily.display, fontSize: 28, fontWeight: 600,
            color: theme.text, letterSpacing: -0.6, marginBottom: space.xs,
          }}>
            Fly without limits
          </div>
          <div style={{ fontSize: font.sm, color: theme.textSecondary, lineHeight: 1.5, maxWidth: 320, margin: '0 auto' }}>
            Every live flight on Earth, unlimited connections, and a few comforts only first class gets.
          </div>
        </div>

        {/* Price */}
        <div style={{
          background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
          borderRadius: radius.xl,
          padding: space.xl,
          textAlign: 'center',
          marginBottom: space.xl,
          boxShadow: `0 16px 32px -8px ${theme.gradientFrom}55`,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 5 }}>
            <span style={{ fontFamily: fontFamily.display, fontSize: 44, fontWeight: 600, color: '#fff', letterSpacing: -1.5 }}>$2.99</span>
            <span style={{ fontSize: font.sm, color: 'rgba(255,255,255,0.7)' }}>/month</span>
          </div>
          <div style={{ fontSize: font.xs, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
            Cancel anytime · Billed monthly
          </div>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm, marginBottom: space.xl }}>
          {PREMIUM_FEATURES.map(f => (
            <div key={f.title} style={{
              display: 'flex', gap: space.md, alignItems: 'flex-start',
              background: theme.bgCard, borderRadius: radius.lg,
              border: `0.5px solid ${theme.border}`,
              padding: `${space.md}px ${space.lg}px`,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: radius.md, flexShrink: 0,
                background: theme.bgCardAlt,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 19,
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontSize: font.sm, fontWeight: 700, color: theme.text, letterSpacing: -0.2, marginBottom: 2 }}>{f.title}</div>
                <div style={{ fontSize: font.xs, color: theme.textSecondary, lineHeight: 1.4 }}>{f.desc}</div>
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
          background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
          color: '#fff',
          fontSize: font.md, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          marginBottom: space.sm,
          boxShadow: `0 8px 20px -4px ${theme.gradientFrom}55`,
        }}>
          {loading ? 'Redirecting...' : 'Upgrade to First Class ✈'}
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