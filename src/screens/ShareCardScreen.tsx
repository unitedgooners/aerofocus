import React, { useRef, useState } from 'react'
import { useThemeStore } from '../store/themeStore'
import { space, radius, font } from '../styles/theme'
import type { Session } from '../types'

interface Props {
  session: Session | null
  onHome: () => void
}

export default function ShareCardScreen({ session, onHome }: Props) {
  const { theme }           = useThemeStore()
  const cardRef             = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  const fmtHrs = (m: number) => m >= 60 ? `${(m / 60).toFixed(1)}h` : `${m}m`

  const handleDownload = async () => {
    if (!cardRef.current) return
    setSaving(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#07111F',
        scale: 2,
        useCORS: true,
        logging: false,
      })
      const link      = document.createElement('a')
      link.download   = `flightfocus-${session?.flight?.id ?? 'session'}.png`
      link.href       = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error('Download failed:', e)
    }
    setSaving(false)
  }

  const handleCopy = () => {
    const text = session
      ? `Just studied for ${fmtHrs(session.focusedMinutes)} aboard ${session.flight?.id} with FlightFocus ✈ flightfocus.app`
      : 'Check out FlightFocus — study at 38,000 feet ✈'
    navigator.clipboard?.writeText(text)
    alert('Copied!')
  }

  if (!session) return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={onHome} style={{ color: theme.textAccent, background: 'none', border: 'none', fontSize: font.md, cursor: 'pointer' }}>← Back</button>
    </div>
  )

  const f       = session.flight
  const pct     = Math.min(100, Math.round((session.focusedMinutes / Math.max(1, f.remainingMinutes + session.focusedMinutes)) * 100))
  const dateStr = new Date(session.startedAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, transition: 'background 0.6s ease' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: `${space.xl}px ${space.lg}px 100px` }}>

        <div style={{ textAlign: 'center', marginBottom: space.xl }}>
          <div style={{ fontSize: 40, marginBottom: space.sm }}>🛬</div>
          <div style={{ fontSize: font.xl, fontWeight: 700, color: theme.text, letterSpacing: -0.5 }}>You landed!</div>
          <div style={{ fontSize: font.sm, color: theme.textSecondary, marginTop: space.xs }}>Here's your boarding pass</div>
        </div>

        {/* Boarding pass — exported by html2canvas */}
        <div ref={cardRef} style={{ background: '#07111F', borderRadius: radius.xl, overflow: 'hidden', marginBottom: space.lg }}>

          <div style={{ padding: `${space.xl}px ${space.xl}px ${space.lg}px` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xl }}>
              <div style={{ fontSize: font.md, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>✈ FlightFocus</div>
              <div style={{ fontSize: font.xs, color: 'rgba(255,255,255,0.4)' }}>{f.id}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: space.xl }}>
              <div>
                <div style={{ fontSize: 42, fontWeight: 700, color: '#fff', letterSpacing: -2, lineHeight: 1 }}>
                  {f.origin === '—' ? '???' : f.origin}
                </div>
                <div style={{ fontSize: font.xs, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{f.originCity}</div>
              </div>
              <div style={{ fontSize: font.xl, color: 'rgba(255,255,255,0.2)', marginBottom: 8 }}>✈</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 42, fontWeight: 700, color: '#fff', letterSpacing: -2, lineHeight: 1 }}>
                  {f.destination === '—' ? '???' : f.destination}
                </div>
                <div style={{ fontSize: font.xs, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{f.destinationCity}</div>
              </div>
            </div>

            <div style={{ fontSize: font.xs, color: 'rgba(255,255,255,0.3)', marginBottom: space.md }}>{dateStr}</div>

            <div style={{ display: 'flex', gap: space.xl, marginBottom: space.lg }}>
              {[
                { val: fmtHrs(session.focusedMinutes), lbl: 'focused' },
                { val: session.mode === 'pomodoro' ? String(session.pomodorosCompleted) : '—', lbl: 'pomodoros' },
                { val: `${pct}%`, lbl: 'of route' },
              ].map(s => (
                <div key={s.lbl}>
                  <div style={{ fontSize: font.xl, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>{s.val}</div>
                  <div style={{ fontSize: font.xs, color: 'rgba(255,255,255,0.35)' }}>{s.lbl}</div>
                </div>
              ))}
            </div>

            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: 4, background: '#38b48b', borderRadius: 2, width: `${pct}%` }} />
            </div>
          </div>

          {/* Tear line */}
          <div style={{ display: 'flex', alignItems: 'center', padding: `0 ${space.lg}px` }}>
            <div style={{ flex: 1, borderTop: '1px dashed rgba(255,255,255,0.12)' }} />
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#07111F', flexShrink: 0, margin: '0 8px' }} />
            <div style={{ flex: 1, borderTop: '1px dashed rgba(255,255,255,0.12)' }} />
          </div>

          {/* Stub */}
          <div style={{ padding: `${space.md}px ${space.xl}px ${space.xl}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: font.xs, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>MODE</div>
              <div style={{ fontSize: font.sm, fontWeight: 600, color: '#38b48b' }}>{session.mode.charAt(0).toUpperCase() + session.mode.slice(1)}</div>
            </div>
            {session.subject && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: font.xs, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>STUDYING</div>
                <div style={{ fontSize: font.sm, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{session.subject}</div>
              </div>
            )}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: font.xs, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>DISTANCE</div>
              <div style={{ fontSize: font.sm, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{session.distanceCoveredKm} km</div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: space.sm, marginBottom: space.md }}>
          <button onClick={handleDownload} disabled={saving} style={{
            flex: 1, padding: 14, borderRadius: radius.md,
            border: `0.5px solid ${theme.borderMed}`,
            background: theme.bgCard, color: theme.text,
            fontSize: font.sm, fontWeight: 500,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
          }}>
            {saving ? 'Saving...' : '↓ Save card'}
          </button>
          <button onClick={handleCopy} style={{
            flex: 1, padding: 14, borderRadius: radius.md,
            border: `0.5px solid ${theme.borderMed}`,
            background: theme.bgCard, color: theme.text,
            fontSize: font.sm, fontWeight: 500, cursor: 'pointer',
          }}>
            ⎘ Copy link
          </button>
        </div>

        {/* Summary */}
        <div style={{ background: theme.bgCard, borderRadius: radius.lg, border: `0.5px solid ${theme.border}`, padding: space.lg, marginBottom: space.lg }}>
          <div style={{ fontSize: font.xs, fontWeight: 600, color: theme.textTertiary, letterSpacing: 1, marginBottom: space.md }}>SESSION SUMMARY</div>
          {[
            { label: 'Flight',       value: f.id },
            { label: 'Airline',      value: f.airline },
            { label: 'Time focused', value: fmtHrs(session.focusedMinutes) },
            { label: 'Distance',     value: `${session.distanceCoveredKm} km` },
            { label: 'Study mode',   value: session.mode },
            ...(session.subject ? [{ label: 'Subject', value: session.subject }] : []),
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: `${space.xs}px 0`, borderBottom: `0.5px solid ${theme.border}` }}>
              <span style={{ fontSize: font.sm, color: theme.textSecondary }}>{row.label}</span>
              <span style={{ fontSize: font.sm, fontWeight: 500, color: theme.text }}>{row.value}</span>
            </div>
          ))}
        </div>

        <button onClick={onHome} style={{
          width: '100%', padding: 16, borderRadius: radius.lg, border: 'none',
          background: theme.bgPrimary, color: '#fff', fontSize: font.md, fontWeight: 600, cursor: 'pointer',
        }}>
          Back to gate
        </button>

      </div>
    </div>
  )
}