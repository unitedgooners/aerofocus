import React, { useState } from 'react'
import { useThemeStore } from '../store/themeStore'
import { space, radius, font, fontFamily } from '../styles/theme'

interface Props {
  onDone: () => void
}

interface Slide {
  icon: string
  title: string
  body: string
}

const SLIDES: Slide[] = [
  {
    icon: '✈',
    title: 'Study at 38,000 feet',
    body: "FlightFocus turns your study sessions into real flights — pick a live aircraft anywhere in the world and study until it lands.",
  },
  {
    icon: '⏱',
    title: 'Three ways to focus',
    body: 'Traditional for a simple timer, Pomodoro for structured work/break intervals, or Flowtime if you\'d rather set your own pace.',
  },
  {
    icon: '🛩',
    title: 'Build your fleet',
    body: "Every session earns cash based on distance flown. Spend it in the Hangar on real aircraft — from a Cessna 172 to an SR-71 Blackbird.",
  },
  {
    icon: '🎫',
    title: 'Collect boarding passes',
    body: 'Customize your boarding pass with themes you unlock, and share your sessions with a personalized card when you land.',
  },
]

export default function OnboardingScreen({ onDone }: Props) {
  const { theme } = useThemeStore()
  const [index, setIndex] = useState(0)

  const isLast = index === SLIDES.length - 1
  const slide  = SLIDES[index]

  const next = () => {
    if (isLast) {
      onDone()
    } else {
      setIndex(i => i + 1)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: theme.bg,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: `${space.xl}px ${space.xl}px`,
        maxWidth: 480, margin: '0 auto', width: '100%',
        textAlign: 'center',
      }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: `linear-gradient(135deg, ${theme.gradientFrom}20, ${theme.gradientTo}20)`,
          border: `0.5px solid ${theme.gradientFrom}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 38, marginBottom: space.xl,
        }}>
          {slide.icon}
        </div>

        <div style={{
          fontFamily: fontFamily.display, fontSize: 28, fontWeight: 600,
          color: theme.text, letterSpacing: -0.5, marginBottom: space.md, lineHeight: 1.15,
        }}>
          {slide.title}
        </div>

        <div style={{ fontSize: font.sm, color: theme.textSecondary, lineHeight: 1.6, maxWidth: 320 }}>
          {slide.body}
        </div>
      </div>

      <div style={{ padding: `0 ${space.xl}px ${space.xl}px`, maxWidth: 480, margin: '0 auto', width: '100%' }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: space.xl }}>
          {SLIDES.map((_, i) => (
            <div key={i} style={{
              width: i === index ? 18 : 6, height: 6, borderRadius: 3,
              background: i === index ? theme.text : theme.border,
              transition: 'all 0.25s ease',
            }} />
          ))}
        </div>

        <button onClick={next} style={{
          width: '100%', padding: 17, borderRadius: radius.lg, border: 'none',
          background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
          color: '#fff', fontSize: font.md, fontWeight: 700, cursor: 'pointer',
          boxShadow: `0 8px 20px -4px ${theme.gradientFrom}55`,
          marginBottom: space.sm,
        }}>
          {isLast ? "Let's fly ✈" : 'Continue'}
        </button>

        {!isLast && (
          <button onClick={onDone} style={{
            width: '100%', padding: 12, background: 'none', border: 'none',
            color: theme.textTertiary, fontSize: font.sm, cursor: 'pointer',
          }}>
            Skip
          </button>
        )}
      </div>
    </div>
  )
}