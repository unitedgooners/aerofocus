import React, { useState } from 'react'
import { useThemeStore } from '../store/themeStore'
import { MOCK_CREW, MOCK_SESSIONS } from '../mock/data'
import { space, radius, font } from '../styles/theme'

export default function CrewScreen() {
  const { theme }   = useThemeStore()
  const [cheered, setCheered] = useState<Set<string>>(new Set())

  const flying  = MOCK_CREW.filter(c => c.currentSession)
  const landed  = MOCK_CREW.filter(c => !c.currentSession && c.lastSession)

  const fmtHrs  = (m: number) => m >= 60 ? `${(m / 60).toFixed(1)}h` : `${m}m`

  const cheer = (id: string) => setCheered(prev => new Set([...prev, id]))

  const sectionLbl: React.CSSProperties = { fontSize: font.xs, fontWeight: 600, color: theme.textTertiary, letterSpacing: 1, marginBottom: space.sm }

  const initials = (name: string) => name.split('_').map(w => w[0].toUpperCase()).join('')

  const avatarColors = ['#EBF3FC', '#E1F5EE', '#FBEAF0', '#FAEEDA', '#F1EFE8']
  const avatarText   = ['#185FA5', '#1B7E60', '#993556', '#854F0B', '#5F5E5A']

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, transition: 'background 0.6s ease' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: `${space.xl}px ${space.lg}px 100px` }}>

        {/* Header */}
        <div style={{ marginBottom: space.xl }}>
          <div style={{ fontSize: font.xl, fontWeight: 700, color: theme.text, letterSpacing: -0.5 }}>Crew</div>
          <div style={{ fontSize: font.sm, color: theme.textSecondary, marginTop: 2 }}>See who's flying right now</div>
        </div>

        {/* In the air */}
        <div style={sectionLbl}>IN THE AIR NOW ● {flying.length}</div>

        {flying.map((member, i) => {
          const s = member.currentSession!
          const isCheered = cheered.has(member.userId)
          return (
            <div key={member.userId} style={{ background: theme.bgCard, borderRadius: radius.lg, border: `0.5px solid ${theme.border}`, padding: space.lg, marginBottom: space.sm }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: space.md, marginBottom: space.md }}>
                {/* Avatar */}
                <div style={{ width: 44, height: 44, borderRadius: radius.pill, background: avatarColors[i % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: font.sm, fontWeight: 700, color: avatarText[i % avatarText.length], flexShrink: 0 }}>
                  {initials(member.username)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: font.md, fontWeight: 600, color: theme.text }}>{member.username}</div>
                  <div style={{ fontSize: font.xs, color: theme.textTertiary, marginTop: 2 }}>
                    {s.flight.origin} → {s.flight.destination} · {s.mode}
                  </div>
                </div>
                <button onClick={() => cheer(member.userId)} style={{
                  padding: '6px 14px', borderRadius: radius.pill,
                  border: `0.5px solid ${isCheered ? theme.accentAlt : theme.borderMed}`,
                  background: isCheered ? theme.bgSuccess : 'transparent',
                  color: isCheered ? theme.textSuccess : theme.textSecondary,
                  fontSize: font.xs, fontWeight: 600, cursor: 'pointer',
                }}>
                  {isCheered ? '✈ cheered!' : '✈ cheer'}
                </button>
              </div>

              {/* Flight progress mini */}
              <div style={{ background: theme.bgCardAlt, borderRadius: radius.md, padding: space.md }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: space.xs }}>
                  <span style={{ fontSize: font.sm, fontWeight: 600, color: theme.text }}>{s.flight.origin} → {s.flight.destination}</span>
                  <span style={{ fontSize: font.xs, color: theme.textTertiary }}>{s.flight.remainingMinutes}m left</span>
                </div>
                <div style={{ height: 3, background: theme.border, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: 3, background: theme.accentAlt, borderRadius: 2, width: `${Math.min(100, (s.focusedMinutes / (s.flight.remainingMinutes + s.focusedMinutes)) * 100)}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: space.xs }}>
                  <span style={{ fontSize: 10, color: theme.textTertiary }}>{fmtHrs(s.focusedMinutes)} focused</span>
                  {s.mode === 'pomodoro' && <span style={{ fontSize: 10, color: theme.textTertiary }}>{s.pomodorosCompleted} 🍅</span>}
                </div>
              </div>
            </div>
          )
        })}

        {/* Recently landed */}
        <div style={{ ...sectionLbl, marginTop: space.xl }}>RECENTLY LANDED</div>

        {[...landed.map(c => c.lastSession!), ...MOCK_SESSIONS].map((s, i) => (
          <div key={s.id + i} style={{ background: theme.bgCard, borderRadius: radius.lg, border: `0.5px solid ${theme.border}`, padding: space.lg, marginBottom: space.sm, display: 'flex', alignItems: 'center', gap: space.md }}>
            <div style={{ width: 36, height: 36, borderRadius: radius.pill, background: avatarColors[(i + 2) % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: font.xs, fontWeight: 700, color: avatarText[(i + 2) % avatarText.length], flexShrink: 0 }}>
              {i < landed.length ? initials(landed[i]?.username ?? 'U') : 'ME'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: font.sm, fontWeight: 600, color: theme.text }}>
                {s.flight.origin} → {s.flight.destination}
              </div>
              <div style={{ fontSize: font.xs, color: theme.textTertiary, marginTop: 2 }}>
                {fmtHrs(s.focusedMinutes)} · {s.mode}{s.subject ? ` · ${s.subject}` : ''}
              </div>
            </div>
            <div style={{ background: theme.bgSuccess, color: theme.textSuccess, fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: radius.pill }}>
              landed
            </div>
          </div>
        ))}

        {/* Add crew CTA */}
        <div style={{ background: theme.bgCard, borderRadius: radius.lg, border: `0.5px dashed ${theme.borderMed}`, padding: space.lg, textAlign: 'center', marginTop: space.md }}>
          <div style={{ fontSize: font.md, color: theme.textSecondary, marginBottom: space.xs }}>Invite your study crew</div>
          <div style={{ fontSize: font.xs, color: theme.textTertiary, marginBottom: space.md }}>See when friends are studying and cheer them on</div>
          <button style={{ padding: '10px 20px', borderRadius: radius.md, border: `0.5px solid ${theme.borderMed}`, background: 'transparent', color: theme.textAccent, fontSize: font.sm, fontWeight: 600, cursor: 'pointer' }}>
            + Invite friends
          </button>
        </div>

      </div>
    </div>
  )
}