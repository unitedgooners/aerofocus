import React from 'react'
import { useThemeStore } from '../store/themeStore'
import { space, radius, font, fontFamily } from '../styles/theme'

interface Props {
  onBack: () => void
  title: string
  lastUpdated: string
  sections: { heading: string; body: string[] }[]
}

// Shared renderer for legal documents — used by both PrivacyPolicyScreen and
// TermsOfServiceScreen so formatting only needs to be maintained in one place.
export default function LegalDocScreen({ onBack, title, lastUpdated, sections }: Props) {
  const { theme } = useThemeStore()

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: theme.bg, overflowY: 'auto' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: `${space.xl}px ${space.lg}px 100px` }}>

        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: theme.textTertiary,
          fontSize: font.sm, cursor: 'pointer', padding: 0, marginBottom: space.lg,
        }}>
          ← Back
        </button>

        <div style={{
          fontFamily: fontFamily.display, fontSize: 26, fontWeight: 600,
          color: theme.text, letterSpacing: -0.3, marginBottom: space.xs,
        }}>
          {title}
        </div>
        <div style={{ fontSize: font.xs, color: theme.textTertiary, marginBottom: space.xl }}>
          Last updated: {lastUpdated}
        </div>

        {sections.map(section => (
          <div key={section.heading} style={{ marginBottom: space.xl }}>
            <div style={{
              fontSize: font.md, fontWeight: 700, color: theme.text,
              marginBottom: space.sm, letterSpacing: -0.2,
            }}>
              {section.heading}
            </div>
            {section.body.map((para, i) => (
              <div key={i} style={{
                fontSize: font.sm, color: theme.textSecondary,
                lineHeight: 1.7, marginBottom: space.sm,
              }}>
                {para}
              </div>
            ))}
          </div>
        ))}

      </div>
    </div>
  )
}