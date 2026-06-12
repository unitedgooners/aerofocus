import React from 'react'
import { useThemeStore } from '../store/themeStore'

type Tab = 'home' | 'live' | 'crew' | 'logbook' | 'hangar'

interface Props {
  active: Tab
  onNavigate: (tab: Tab) => void
  hasActiveSession?: boolean
}

export default function BottomNav({ active, onNavigate, hasActiveSession }: Props) {
  const { theme } = useThemeStore()

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'home',    label: 'Home',    icon: '⌂' },
    { id: 'live',    label: 'Fly',     icon: '✈' },
    { id: 'crew',    label: 'Crew',    icon: '◎' },
    { id: 'logbook', label: 'Logbook', icon: '▦' },
  ]

  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      background: theme.navBg,
      borderTop: `0.5px solid ${theme.navBorder}`,
      display: 'flex',
      maxWidth: 480,
      margin: '0 auto',
      zIndex: 100,
      transition: 'background 0.6s ease, border-color 0.6s ease',
    }}>
      {tabs.map(tab => {
        const isActive = active === tab.id
        const isLive = tab.id === 'live'
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            style={{
              flex: 1,
              padding: '10px 0 8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              position: 'relative',
            }}
          >
            {/* Live session dot */}
            {isLive && hasActiveSession && (
              <div style={{
                position: 'absolute',
                top: 8, right: '50%',
                marginRight: -16,
                width: 6, height: 6,
                borderRadius: '50%',
                background: theme.accentAlt,
              }} />
            )}
            <span style={{
              fontSize: 18,
              color: isActive ? theme.navActive : theme.navInactive,
              transition: 'color 0.3s',
            }}>{tab.icon}</span>
            <span style={{
              fontSize: 10,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? theme.navActive : theme.navInactive,
              transition: 'color 0.3s',
            }}>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}