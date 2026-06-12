import React, { useRef, useState, useEffect } from 'react'
import { useThemeStore } from '../store/themeStore'
import { useAuthStore } from '../store/authStore'
import { useBoardingPassThemeStore } from '../store/boardingPassThemeStore'
import { space, radius, font } from '../styles/theme'
import { getPassColors } from '../styles/passThemes'
import { useEffectivePremium } from '../hooks/useEffectivePremium'
import type { Session } from '../types'

interface Props {
  session: Session | null
  onHome: () => void
}

const STICKERS = ['✈', '🛫', '🛬', '⭐', '🔥', '📚', '🎯', '🏆', '☁', '🌍']

export default function ShareCardScreen({ session, onHome }: Props) {
  const { theme }           = useThemeStore()
  const { user }            = useAuthStore()
  const { activeThemeId, load: loadTheme } = useBoardingPassThemeStore()
  const isPremium           = useEffectivePremium()
  const cardRef             = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const [caption, setCaption] = useState('')
  const [sticker, setSticker] = useState('')
  const [showCustomize, setShowCustomize] = useState(false)

  useEffect(() => {
    if (user?.id) loadTheme(user.id)
  }, [user?.id])

  const pass = getPassColors(activeThemeId)

  const fmtHrs = (m: number) => m >= 60 ? `${(m / 60).toFixed(1)}h` : `${m}m`

  const handleDownload = async () => {
    if (!cardRef.current) return
    setSaving(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: pass.bg,
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
        <div ref={cardRef} style={{ background: pass.bg, borderRadius: radius.xl, overflow: 'hidden', marginBottom: space.lg, position: 'relative' }}>

          {/* Premium sticker overlay */}
          {sticker && (
            <div style={{
              position: 'absolute', top: 16, right: 16,
              fontSize: 32, zIndex: 2,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            }}>
              {sticker}
            </div>
          )}

          <div style={{ padding: `${space.xl}px ${space.xl}px ${space.lg}px` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xl }}>
              <div style={{ fontSize: font.md, fontWeight: 600, color: pass.text, opacity: 0.9 }}>✈ FlightFocus</div>
              <div style={{ fontSize: font.xs, color: pass.text, opacity: 0.4 }}>{f.id}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: space.xl }}>
              <div>
                <div style={{ fontSize: 42, fontWeight: 700, color: pass.text, letterSpacing: -2, lineHeight: 1 }}>
                  {f.origin === '—' ? '???' : f.origin}
                </div>
                <div style={{ fontSize: font.xs, color: pass.text, opacity: 0.4, marginTop: 4 }}>{f.originCity}</div>
              </div>
              <div style={{ fontSize: font.xl, color: pass.text, opacity: 0.2, marginBottom: 8 }}>✈</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 42, fontWeight: 700, color: pass.text, letterSpacing: -2, lineHeight: 1 }}>
                  {f.destination === '—' ? '???' : f.destination}
                </div>
                <div style={{ fontSize: font.xs, color: pass.text, opacity: 0.4, marginTop: 4 }}>{f.destinationCity}</div>
              </div>
            </div>

            <div style={{ fontSize: font.xs, color: pass.text, opacity: 0.3, marginBottom: space.md }}>{dateStr}</div>

            <div style={{ display: 'flex', gap: space.xl, marginBottom: space.lg }}>
              {[
                { val: fmtHrs(session.focusedMinutes), lbl: 'focused' },
                { val: session.mode === 'pomodoro' ? String(session.pomodorosCompleted) : '—', lbl: 'pomodoros' },
                { val: `${pct}%`, lbl: 'of route' },
              ].map(s => (
                <div key={s.lbl}>
                  <div style={{ fontSize: font.xl, fontWeight: 700, color: pass.text, letterSpacing: -0.5 }}>{s.val}</div>
                  <div style={{ fontSize: font.xs, color: pass.text, opacity: 0.35 }}>{s.lbl}</div>
                </div>
              ))}
            </div>

            <div style={{ height: 4, background: `${pass.text}1A`, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: 4, background: pass.accent, borderRadius: 2, width: `${pct}%` }} />
            </div>

            {caption && (
              <div style={{
                marginTop: space.md, fontSize: font.sm, fontStyle: 'italic',
                color: pass.text, opacity: 0.85, lineHeight: 1.5,
              }}>
                "{caption}"
              </div>
            )}
          </div>

          {/* Tear line */}
          <div style={{ display: 'flex', alignItems: 'center', padding: `0 ${space.lg}px` }}>
            <div style={{ flex: 1, borderTop: `1px dashed ${pass.text}1F` }} />
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: pass.bg, flexShrink: 0, margin: '0 8px' }} />
            <div style={{ flex: 1, borderTop: `1px dashed ${pass.text}1F` }} />
          </div>

          {/* Stub */}
          <div style={{ padding: `${space.md}px ${space.xl}px ${space.xl}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: font.xs, color: pass.text, opacity: 0.3, marginBottom: 2 }}>MODE</div>
              <div style={{ fontSize: font.sm, fontWeight: 600, color: pass.accent }}>{session.mode.charAt(0).toUpperCase() + session.mode.slice(1)}</div>
            </div>
            {session.subject && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: font.xs, color: pass.text, opacity: 0.3, marginBottom: 2 }}>STUDYING</div>
                <div style={{ fontSize: font.sm, fontWeight: 600, color: pass.text, opacity: 0.7 }}>{session.subject}</div>
              </div>
            )}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: font.xs, color: pass.text, opacity: 0.3, marginBottom: 2 }}>DISTANCE</div>
              <div style={{ fontSize: font.sm, fontWeight: 600, color: pass.text, opacity: 0.7 }}>{session.distanceCoveredKm} km</div>
            </div>
          </div>
        </div>

        {/* Personalize — premium only */}
        {isPremium ? (
          <div style={{ marginBottom: space.md }}>
            <button onClick={() => setShowCustomize(v => !v)} style={{
              width: '100%', padding: 12, borderRadius: radius.md,
              border: `0.5px solid ${theme.borderMed}`,
              background: theme.bgCard, color: theme.textAccent,
              fontSize: font.sm, fontWeight: 600, cursor: 'pointer',
            }}>
              {showCustomize ? '▾ Hide personalization' : '✨ Personalize this card'}
            </button>

            {showCustomize && (
              <div style={{ background: theme.bgCard, borderRadius: radius.lg, border: `0.5px solid ${theme.border}`, padding: space.lg, marginTop: space.sm }}>
                <div style={{ marginBottom: space.md }}>
                  <label style={{ fontSize: font.xs, fontWeight: 600, color: theme.textTertiary, letterSpacing: 0.5, display: 'block', marginBottom: space.xs }}>
                    CAPTION
                  </label>
                  <input
                    type="text" placeholder="e.g. Knocked out my calc homework!" value={caption}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCaption(e.target.value.slice(0, 80))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: radius.md, border: `0.5px solid ${theme.borderMed}`, background: theme.bgInput, color: theme.text, fontSize: font.sm, outline: 'none' }}
                  />
                  <div style={{ fontSize: 10, color: theme.textTertiary, marginTop: 4 }}>{caption.length}/80</div>
                </div>

                <div>
                  <label style={{ fontSize: font.xs, fontWeight: 600, color: theme.textTertiary, letterSpacing: 0.5, display: 'block', marginBottom: space.xs }}>
                    STICKER
                  </label>
                  <div style={{ display: 'flex', gap: space.xs, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setSticker('')}
                      style={{
                        width: 36, height: 36, borderRadius: radius.md,
                        border: `0.5px solid ${theme.borderMed}`,
                        background: sticker === '' ? theme.bgPrimary : theme.bgCardAlt,
                        fontSize: 14, cursor: 'pointer',
                        color: sticker === '' ? '#fff' : theme.textTertiary,
                      }}
                    >
                      ✕
                    </button>
                    {STICKERS.map(s => (
                      <button
                        key={s}
                        onClick={() => setSticker(s)}
                        style={{
                          width: 36, height: 36, borderRadius: radius.md,
                          border: `${sticker === s ? '2px' : '0.5px'} solid ${sticker === s ? theme.bgPrimary : theme.borderMed}`,
                          background: theme.bgCardAlt,
                          fontSize: 18, cursor: 'pointer',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: space.md,
            background: theme.bgCard, border: `0.5px dashed ${theme.border}`,
            borderRadius: radius.lg, padding: `${space.md}px ${space.lg}px`,
            marginBottom: space.md, opacity: 0.7,
          }}>
            <span style={{ fontSize: 20 }}>✨</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: font.sm, color: theme.textSecondary, fontWeight: 500 }}>Personalize this card · Premium 🔒</div>
              <div style={{ fontSize: font.xs, color: theme.textTertiary, marginTop: 2 }}>Add captions and stickers to your boarding pass</div>
            </div>
          </div>
        )}

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