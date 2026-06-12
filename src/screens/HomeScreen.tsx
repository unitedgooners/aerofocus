import React, { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useSessionStore } from '../store/sessionStore'
import { useThemeStore } from '../store/themeStore'
import { useFlightPool } from '../hooks/useFlightPool'
import { MOCK_SESSIONS } from '../mock/data'
import { space, radius, font } from '../styles/theme'
import type { Flight, StudyMode } from '../types'
import type { PomoCfg } from '../hooks/usePomodoro'

interface Props {
  onBoard: (flight: Flight, mode: StudyMode, subject: string, pomoCfg?: PomoCfg, wantsChain?: boolean) => void
  onUpgrade: () => void
  onHangar: () => void
}

type Step = 'mode' | 'settings' | 'flight'

const MODES: { label: string; value: StudyMode; desc: string; icon: string }[] = [
  { label: 'Traditional', value: 'traditional', icon: '📖', desc: 'Study for the full flight, no breaks' },
  { label: 'Pomodoro',    value: 'pomodoro',    icon: '🍅', desc: 'Structured work and break intervals' },
  { label: 'Flowtime',    value: 'flowtime',    icon: '🌊', desc: 'Work until you naturally need a break' },
]

const POMO_FIELDS: { label: string; key: keyof PomoCfg; min: number; max: number; step: number }[] = [
  { label: 'Work',        key: 'workMinutes',       min: 5,  max: 90, step: 5 },
  { label: 'Short break', key: 'shortBreakMinutes', min: 1,  max: 30, step: 1 },
  { label: 'Long break',  key: 'longBreakMinutes',  min: 0,  max: 60, step: 5 },
]

function matchScore(flightMinutes: number, targetMinutes: number): number {
  return Math.abs(flightMinutes - targetMinutes)
}

function calcTarget(mode: StudyMode, cfg: PomoCfg, blockCount: number, targetDuration: number): number {
  if (mode === 'pomodoro') {
    const cycleMinutes = cfg.workMinutes + cfg.shortBreakMinutes
    return cycleMinutes * blockCount + cfg.longBreakMinutes
  }
  return targetDuration
}

export default function HomeScreen({ onBoard, onUpgrade, onHangar }: Props) {
  const { user, logout }    = useAuthStore()
  const { theme }           = useThemeStore()
  const { flights, isLoading, error, lastFetched, isPremium } = useFlightPool()

  const [step, setStep]         = useState<Step>('mode')
  const [mode, setMode]         = useState<StudyMode | null>(null)
  const [subject, setSubject]   = useState('')
  const [selected, setSelected] = useState<Flight | null>(null)
  const [pomoCfg, setPomoCfg]   = useState<PomoCfg>({
    workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15,
  })
  const [blockCount, setBlockCount]           = useState(4)
  const [targetDuration, setTargetDuration]   = useState(60)
  const [wantsChain, setWantsChain]           = useState(false)

  const target = mode ? calcTarget(mode, pomoCfg, blockCount, targetDuration) : 60

  const sortedFlights = [...flights].sort(
    (a, b) => matchScore(a.remainingMinutes, target) - matchScore(b.remainingMinutes, target)
  )

  const handleSelectMode = (m: StudyMode) => { setMode(m); setStep('settings') }

  const handleSelectFlight = (f: Flight) => { setSelected(f) }

  const handleBoard = () => {
    if (!selected || !mode) return
    onBoard(
      selected,
      mode,
      subject,
      mode === 'pomodoro' ? { ...pomoCfg, blockCount } : undefined,
      wantsChain
    )
  }

  const leftoverMinutes = selected ? Math.max(0, target - selected.remainingMinutes) : 0

  const adjust = (key: keyof PomoCfg, delta: number, min: number, max: number) =>
    setPomoCfg(p => ({ ...p, [key]: Math.min(max, Math.max(min, p[key] + delta)) }))

  const fmtHrs  = (m: number) => m >= 60 ? `${(m / 60).toFixed(1)}h` : `${m}m`
  const fmtLeft = (m: number) => {
    const h = Math.floor(m / 60)
    return h > 0 ? `${h}h ${m % 60}m left` : `${m}m left`
  }

  const card: React.CSSProperties = {
    background: theme.bgCard, borderRadius: radius.lg,
    border: `0.5px solid ${theme.border}`,
    padding: `${space.md}px ${space.lg}px`, marginBottom: space.sm,
  }
  const sectionLbl: React.CSSProperties = {
    fontSize: font.xs, fontWeight: 600, color: theme.textTertiary,
    letterSpacing: 1, marginBottom: space.sm, marginTop: space.lg, display: 'block',
  }
  const adjBtn: React.CSSProperties = {
    width: 32, height: 32, borderRadius: radius.sm,
    border: `0.5px solid ${theme.borderMed}`,
    background: theme.bgCard, color: theme.text,
    cursor: 'pointer', fontSize: 18,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }
  const backBtn: React.CSSProperties = {
    background: 'none', border: 'none', color: theme.textSecondary,
    fontSize: font.sm, cursor: 'pointer', padding: `${space.sm}px 0`,
    display: 'flex', alignItems: 'center', gap: space.xs, marginBottom: space.lg,
  }

  const steps: Step[] = ['mode', 'settings', 'flight']
  const stepLabels    = ['Method', 'Setup', 'Flight']

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, transition: 'background 0.6s ease' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: `${space.xl}px ${space.lg}px 100px` }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xl }}>
          <div>
            <div style={{ fontSize: font.xs, color: theme.textTertiary, marginBottom: 2 }}>Welcome back,</div>
            <div style={{ fontSize: font.xl, fontWeight: 700, color: theme.text, letterSpacing: -0.5 }}>{user?.username}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
            <div onClick={onHangar} style={{ background: theme.bgSuccess, color: theme.textSuccess, padding: '5px 12px', borderRadius: radius.pill, fontSize: font.xs, fontWeight: 600, cursor: 'pointer' }}>
              ${(user?.cashBalance ?? 0).toFixed(2)} 🛩
            </div>
            <div style={{ background: theme.bgWarning, color: theme.textWarning, padding: '5px 12px', borderRadius: radius.pill, fontSize: font.xs, fontWeight: 600 }}>
              🔥 {user?.streakDays} days
            </div>
            <button onClick={logout} style={{ background: 'none', border: `0.5px solid ${theme.border}`, color: theme.textTertiary, padding: '5px 12px', borderRadius: radius.pill, fontSize: font.xs, cursor: 'pointer' }}>
              out
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: space.sm, marginBottom: space.xl }}>
          {[
            { label: 'Focus time', value: fmtHrs(user?.totalFocusMinutes ?? 0) },
            { label: 'Flights',    value: String(user?.totalFlights ?? 0) },
            { label: 'Km flown',   value: `${Math.round((user?.totalDistanceKm ?? 0) / 1000)}k` },
          ].map(s => (
            <div key={s.label} style={{ background: theme.bgCard, borderRadius: radius.md, padding: space.md, border: `0.5px solid ${theme.border}`, textAlign: 'center' }}>
              <div style={{ fontSize: font.lg, fontWeight: 700, color: theme.text, letterSpacing: -0.5, marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: font.xs, color: theme.textTertiary }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Referral card — first 500 referrals win a Wright Model B */}
        {user?.referralCode && (
          <div
            onClick={() => {
              const link = `${window.location.origin}?ref=${user.referralCode}`
              navigator.clipboard?.writeText(link)
              alert('Referral link copied! Share it with a friend ✈')
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: space.md,
              background: theme.bgCard, border: `0.5px solid ${theme.border}`,
              borderRadius: radius.lg, padding: `${space.md}px ${space.lg}px`,
              marginBottom: space.xl, cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 20 }}>🎁</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: font.sm, fontWeight: 600, color: theme.text }}>
                Invite a friend, win a Wright Model B
              </div>
              <div style={{ fontSize: font.xs, color: theme.textTertiary, marginTop: 2 }}>
                Your code: <strong style={{ color: theme.textAccent, letterSpacing: 1 }}>{user.referralCode}</strong> · tap to copy your link
              </div>
            </div>
          </div>
        )}

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: space.sm, marginBottom: space.xl }}>
          {steps.map((s, i) => {
            const isActive   = s === step
            const isComplete = steps.indexOf(step) > i
            return (
              <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', height: 3, borderRadius: 2, background: isComplete || isActive ? theme.bgPrimary : theme.border, transition: 'background 0.3s' }} />
                <div style={{ fontSize: 10, color: isActive ? theme.textAccent : isComplete ? theme.textSuccess : theme.textTertiary, fontWeight: isActive ? 600 : 400 }}>
                  {isComplete ? '✓ ' : ''}{stepLabels[i]}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── STEP 1: MODE ─────────────────────────────────────────────────── */}
        {step === 'mode' && (
          <>
            <div style={sectionLbl}>HOW DO YOU WANT TO STUDY?</div>
            {MODES.map(m => (
              <button key={m.value} onClick={() => handleSelectMode(m.value)} style={{
                display: 'flex', alignItems: 'center', gap: space.lg,
                width: '100%', textAlign: 'left',
                background: theme.bgCard, border: `0.5px solid ${theme.border}`,
                borderRadius: radius.lg, padding: space.lg,
                marginBottom: space.sm, cursor: 'pointer',
              }}>
                <div style={{ width: 48, height: 48, borderRadius: radius.md, background: theme.bgCardAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {m.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: font.md, fontWeight: 700, color: theme.text, marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: font.xs, color: theme.textSecondary }}>{m.desc}</div>
                </div>
                <span style={{ color: theme.textTertiary, fontSize: 20 }}>›</span>
              </button>
            ))}

            <div style={sectionLbl}>RECENT FLIGHTS</div>
            {MOCK_SESSIONS.map(s => (
              <div key={s.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: font.md, fontWeight: 600, color: theme.text, marginBottom: 3 }}>{s.flight.id}</div>
                  <div style={{ fontSize: font.xs, color: theme.textTertiary }}>
                    {fmtHrs(s.focusedMinutes)} · {s.mode}{s.subject ? ` · ${s.subject}` : ''}
                  </div>
                </div>
                <div style={{ background: theme.bgSuccess, color: theme.textSuccess, fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: radius.pill }}>landed</div>
              </div>
            ))}
          </>
        )}

        {/* ── STEP 2: SETTINGS ─────────────────────────────────────────────── */}
        {step === 'settings' && mode && (
          <>
            <button style={backBtn} onClick={() => setStep('mode')}>← Back</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: space.md, marginBottom: space.xl }}>
              <div style={{ width: 44, height: 44, borderRadius: radius.md, background: theme.bgCardAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                {MODES.find(m => m.value === mode)?.icon}
              </div>
              <div>
                <div style={{ fontSize: font.lg, fontWeight: 700, color: theme.text }}>{MODES.find(m => m.value === mode)?.label}</div>
                <div style={{ fontSize: font.xs, color: theme.textSecondary }}>{MODES.find(m => m.value === mode)?.desc}</div>
              </div>
            </div>

            {mode === 'pomodoro' && (
              <>
                <div style={sectionLbl}>INTERVAL SETTINGS</div>
                <div style={{ background: theme.bgCard, borderRadius: radius.lg, border: `0.5px solid ${theme.border}`, padding: space.lg, marginBottom: space.lg }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: space.lg }}>
                    {POMO_FIELDS.map(({ label, key, min, max, step: s }) => (
                      <div key={key} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: font.xs, color: theme.textSecondary, marginBottom: space.sm }}>{label}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: space.xs, justifyContent: 'center' }}>
                          <button style={adjBtn} onClick={() => adjust(key, -s, min, max)}>−</button>
                          <div style={{ minWidth: 36, textAlign: 'center', fontSize: font.lg, fontWeight: 700, color: theme.text }}>{pomoCfg[key]}</div>
                          <button style={adjBtn} onClick={() => adjust(key, s, min, max)}>+</button>
                        </div>
                        <div style={{ fontSize: 10, color: theme.textTertiary, marginTop: 4 }}>
                          {pomoCfg[key] === 0 && key === 'longBreakMinutes' ? 'none' : 'min'}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: `0.5px solid ${theme.border}`, marginTop: space.lg, paddingTop: space.lg }}>
                    <div style={{ fontSize: font.xs, color: theme.textSecondary, textAlign: 'center', marginBottom: space.md }}>Number of blocks</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: space.md, justifyContent: 'center', marginBottom: space.sm }}>
                      <button style={{ ...adjBtn, width: 40, height: 40, fontSize: 20 }} onClick={() => setBlockCount(b => Math.max(1, b - 1))}>−</button>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 36, fontWeight: 700, color: theme.text, letterSpacing: -1, lineHeight: 1 }}>{blockCount}</div>
                        <div style={{ fontSize: 10, color: theme.textTertiary, marginTop: 2 }}>{blockCount === 1 ? 'block' : 'blocks'}</div>
                      </div>
                      <button style={{ ...adjBtn, width: 40, height: 40, fontSize: 20 }} onClick={() => setBlockCount(b => Math.min(20, b + 1))}>+</button>
                    </div>
                    <div style={{ display: 'flex', gap: space.xs, justifyContent: 'center' }}>
                      {[2, 4, 6, 8, 10].map(b => (
                        <button key={b} onClick={() => setBlockCount(b)} style={{
                          padding: '4px 10px', borderRadius: radius.pill, fontSize: font.xs, cursor: 'pointer',
                          border: `0.5px solid ${blockCount === b ? theme.bgPrimary : theme.border}`,
                          background: blockCount === b ? (theme.mode === 'light' ? '#EBF3FC' : '#112240') : theme.bgCardAlt,
                          color: blockCount === b ? theme.textAccent : theme.textSecondary,
                          fontWeight: blockCount === b ? 600 : 400,
                        }}>{b}</button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: space.lg, padding: `${space.sm}px ${space.md}px`, background: theme.bgCardAlt, borderRadius: radius.sm, fontSize: font.xs, color: theme.textSecondary, textAlign: 'center' }}>
                    {blockCount} × {pomoCfg.workMinutes}m work · {pomoCfg.shortBreakMinutes}m breaks
                    {pomoCfg.longBreakMinutes > 0 ? ` · ${pomoCfg.longBreakMinutes}m long break every 4` : ' · no long breaks'}
                    <span style={{ fontWeight: 600, color: theme.text, marginLeft: 6 }}>
                      ≈ {Math.round(calcTarget('pomodoro', pomoCfg, blockCount, 0))}m total
                    </span>
                  </div>
                </div>
              </>
            )}

            {(mode === 'traditional' || mode === 'flowtime') && (
              <>
                <div style={sectionLbl}>HOW LONG DO YOU WANT TO STUDY?</div>
                <div style={{ background: theme.bgCard, borderRadius: radius.lg, border: `0.5px solid ${theme.border}`, padding: space.xl, marginBottom: space.lg }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: space.lg, justifyContent: 'center', marginBottom: space.md }}>
                    <button style={{ ...adjBtn, width: 44, height: 44, fontSize: 22 }} onClick={() => setTargetDuration(d => Math.max(15, d - 15))}>−</button>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 48, fontWeight: 700, color: theme.text, letterSpacing: -2, lineHeight: 1 }}>
                        {targetDuration >= 60
                          ? `${Math.floor(targetDuration / 60)}h${targetDuration % 60 > 0 ? `${targetDuration % 60}m` : ''}`
                          : `${targetDuration}m`}
                      </div>
                      <div style={{ fontSize: font.xs, color: theme.textTertiary, marginTop: 4 }}>target duration</div>
                    </div>
                    <button style={{ ...adjBtn, width: 44, height: 44, fontSize: 22 }} onClick={() => setTargetDuration(d => Math.min(180, d + 15))}>+</button>
                  </div>
                  <div style={{ display: 'flex', gap: space.sm, justifyContent: 'center' }}>
                    {[30, 45, 60, 90, 120].map(t => (
                      <button key={t} onClick={() => setTargetDuration(t)} style={{
                        padding: '4px 12px', borderRadius: radius.pill, fontSize: font.xs, cursor: 'pointer',
                        border: `0.5px solid ${targetDuration === t ? theme.bgPrimary : theme.border}`,
                        background: targetDuration === t ? (theme.mode === 'light' ? '#EBF3FC' : '#112240') : theme.bgCardAlt,
                        color: targetDuration === t ? theme.textAccent : theme.textSecondary,
                        fontWeight: targetDuration === t ? 600 : 400,
                      }}>
                        {t >= 60 ? `${t / 60}h` : `${t}m`}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div style={sectionLbl}>WHAT ARE YOU STUDYING? (OPTIONAL)</div>
            <input
              placeholder="e.g. Organic Chemistry, Bar Exam, Spanish..."
              value={subject}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
              style={{ width: '100%', padding: '13px 14px', borderRadius: radius.md, border: `0.5px solid ${theme.borderMed}`, background: theme.bgInput, color: theme.text, fontSize: font.sm, outline: 'none', marginBottom: space.xl }}
            />

            <button onClick={() => setStep('flight')} style={{
              width: '100%', padding: 16, borderRadius: radius.lg, border: 'none',
              background: theme.bgPrimary, color: '#fff', fontSize: font.md, fontWeight: 600, cursor: 'pointer',
            }}>
              Find my flight →
            </button>
          </>
        )}

        {/* ── STEP 3: FLIGHT ───────────────────────────────────────────────── */}
        {step === 'flight' && mode && (
          <>
            <button style={backBtn} onClick={() => setStep('settings')}>← Back</button>

            <div style={{ background: theme.bgCardAlt, borderRadius: radius.md, padding: `${space.sm}px ${space.md}px`, marginBottom: space.lg, fontSize: font.xs, color: theme.textSecondary, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                {MODES.find(m => m.value === mode)?.icon} {mode === 'pomodoro' ? `${pomoCfg.workMinutes}m/${pomoCfg.shortBreakMinutes}m · ${blockCount} blocks` : `${fmtHrs(targetDuration)} ${mode}`}
                {subject ? ` · ${subject}` : ''}
              </span>
              <span style={{ color: theme.textAccent, fontWeight: 600 }}>~{fmtHrs(target)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm }}>
              <span style={{ fontSize: font.xs, fontWeight: 600, color: theme.textTertiary, letterSpacing: 1 }}>BEST MATCHES</span>
              {lastFetched && (
                <span style={{ fontSize: font.xs, color: theme.textTertiary }}>
                  {flights.length} live · {lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            {error && (
              <div style={{ background: theme.bgWarning, borderRadius: radius.md, padding: `${space.sm}px ${space.md}px`, marginBottom: space.sm, fontSize: font.xs, color: theme.textWarning }}>
                ⚠ {error}
              </div>
            )}

            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ ...card, height: 72, opacity: 0.3 + i * 0.1, background: theme.bgCardAlt }} />
                ))
              : sortedFlights.map((f, i) => {
                  const diff      = Math.abs(f.remainingMinutes - target)
                  const isGood    = diff <= 15
                  const isFair    = diff <= 30 && !isGood
                  const isSel     = selected?.id === f.id
                  return (
                    <button key={f.id} onClick={() => handleSelectFlight(f)} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      width: '100%', textAlign: 'left',
                      background: isSel ? (theme.mode === 'light' ? '#EBF3FC' : '#112240') : theme.bgCard,
                      border: `${isSel ? '2px' : '0.5px'} solid ${isSel ? theme.bgPrimary : theme.border}`,
                      borderRadius: radius.lg, padding: `${space.md}px ${space.lg}px`,
                      marginBottom: space.sm, cursor: 'pointer',
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: space.sm, marginBottom: 4 }}>
                          {i === 0 && (
                            <span style={{ fontSize: 10, background: theme.bgSuccess, color: theme.textSuccess, padding: '2px 8px', borderRadius: radius.pill, fontWeight: 600 }}>best match</span>
                          )}
                          <span style={{ fontSize: font.md, fontWeight: 700, color: theme.text, letterSpacing: -0.5 }}>{f.id}</span>
                          <span style={{ fontSize: font.xs, background: theme.bgSuccess, color: theme.textSuccess, padding: '2px 6px', borderRadius: radius.pill }}>● live</span>
                        </div>
                        <div style={{ fontSize: font.xs, color: theme.textSecondary }}>
                          {f.airline} · {f.altitude.toLocaleString()} ft
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: font.sm, fontWeight: 700, color: isGood ? theme.textSuccess : isFair ? theme.textWarning : theme.textSecondary }}>
                          {fmtLeft(f.remainingMinutes)}
                        </div>
                        <div style={{ fontSize: 10, color: theme.textTertiary, marginTop: 2 }}>
                          {isGood ? '✓ great fit' : isFair ? '~ close' : `${diff}m off`}
                        </div>
                      </div>
                    </button>
                  )
                })
            }

            {/* Connecting flight checkbox — show when flight is shorter than target */}
            {selected && leftoverMinutes >= 10 && (
              <div style={{
                background: wantsChain
                  ? (theme.mode === 'light' ? '#EBF3FC' : '#112240')
                  : theme.bgCard,
                border: `${wantsChain ? '2px' : '0.5px'} solid ${wantsChain ? theme.bgPrimary : theme.border}`,
                borderRadius: radius.lg,
                padding: space.lg,
                marginBottom: space.md,
              }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: space.md, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={wantsChain}
                    onChange={e => setWantsChain(e.target.checked)}
                    style={{ marginTop: 2, width: 16, height: 16, cursor: 'pointer', accentColor: theme.bgPrimary }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: font.sm, fontWeight: 600, color: theme.text, marginBottom: 4 }}>
                      Assign a connecting flight
                    </div>
                    <div style={{ fontSize: font.xs, color: theme.textSecondary }}>
                      You have ~{leftoverMinutes}m left after this flight lands. When it lands we'll find the best live flight and keep you going.
                    </div>
                  </div>
                </label>
              </div>
            )}

            {!isPremium && (
              <div onClick={onUpgrade} style={{ display: 'flex', alignItems: 'center', gap: space.md, background: theme.bgCard, border: `0.5px dashed ${theme.border}`, borderRadius: radius.lg, padding: `${space.md}px ${space.lg}px`, marginBottom: space.lg, cursor: 'pointer' }}>
                <span>✈</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: font.sm, color: theme.textSecondary, fontWeight: 500 }}>More flights + airport picker · Upgrade to Premium</div>
                  <div style={{ fontSize: font.xs, color: theme.textTertiary, marginTop: 2 }}>$2.99/mo · Access all live flights worldwide</div>
                </div>
                <span style={{ fontSize: font.xs, color: theme.textAccent, fontWeight: 600 }}>Upgrade →</span>
              </div>
            )}

            {selected && (
              <button onClick={handleBoard} style={{
                width: '100%', padding: 18, borderRadius: radius.lg, border: 'none',
                background: theme.bgPrimary, color: '#fff', fontSize: font.md,
                fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5,
              }}>
                {wantsChain ? 'View Boarding Pass · connecting ✈✈' : 'View Boarding Pass ✈'}
              </button>
            )}
          </>
        )}

      </div>
    </div>
  )
}