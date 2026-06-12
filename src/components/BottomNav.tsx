import React from 'react'
import { useThemeStore } from '../store/themeStore'

type Tab = 'home' | 'live' | 'crew' | 'logbook' | 'hangar'

interface Props {
  active: Tab
  onNavigate: (tab: Tab) => void
  hasActiveSession?: boolean
}

// Simple propeller — center hub circle with 4 elongated blades
function PropellerIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="6"  rx="2.2" ry="5.5" fill={color} />
      <ellipse cx="18" cy="12" rx="5.5" ry="2.2" fill={color} />
      <ellipse cx="12" cy="18" rx="2.2" ry="5.5" fill={color} />
      <ellipse cx="6"  cy="12" rx="5.5" ry="2.2" fill={color} />
      <circle  cx="12" cy="12" r="2.6" fill={color} />
    </svg>
  )
}

export default function BottomNav({ active, onNavigate, hasActiveSession }: Props) {
  const { theme } = useThemeStore()

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'home',    label: 'Home',    icon: '⌂' },
    { id: 'live',    label: 'Fly',     icon: '✈' },
    { id: 'hangar',  label: 'Hangar',  icon: '🛩' },
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
            {tab.id === 'hangar' ? (
              <div style={{ height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PropellerIcon color={isActive ? theme.navActive : theme.navInactive} />
              </div>
            ) : (
              <span style={{
                fontSize: 18,
                lineHeight: '18px',
                color: isActive ? theme.navActive : theme.navInactive,
                transition: 'color 0.3s',
              }}>{tab.icon}</span>
            )}
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