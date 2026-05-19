import React, { useState, useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { useSessionStore } from './store/sessionStore'
import { useThemeStore } from './store/themeStore'
import LoginScreen from './screens/LoginScreen'
import HomeScreen from './screens/HomeScreen'
import BoardingPassScreen from './screens/BoardingPassScreen'
import LiveSessionScreen from './screens/LiveSessionScreen'
import ShareCardScreen from './screens/ShareCardScreen'
import CrewScreen from './screens/CrewScreen'
import LogbookScreen from './screens/LogbookScreen'
import ResetPasswordScreen from './screens/ResetPasswordScreen'
import UpgradeScreen from './screens/UpgradeScreen'
import BottomNav from './components/BottomNav'
import type { Flight, Session, StudyMode } from './types'
import type { PomoCfg } from './hooks/usePomodoro'

type Tab = 'home' | 'boarding' | 'live' | 'crew' | 'logbook'

interface BoardingInfo {
  flight: Flight
  mode: StudyMode
  subject: string
  pomoCfg?: PomoCfg & { blockCount?: number }
  wantsChain?: boolean
}

export default function App() {
  const { user, isLoading, loadSession, refreshProfile } = useAuthStore()
  const { activeSession, startSession }  = useSessionStore()
  const { setLight }                     = useThemeStore()
  const [tab, setTab]                    = useState<Tab>('home')
  const [boarding, setBoarding]          = useState<BoardingInfo | null>(null)
  const [lastSession, setLastSession]    = useState<Session | null>(null)
  const [showShare, setShowShare]        = useState(false)
  const [showUpgrade, setShowUpgrade]    = useState(false)
  const [isReset, setIsReset]            = useState(false)

  useEffect(() => {
    loadSession()

    // Check for password reset redirect (#type=recovery in URL hash)
    const hash   = window.location.hash
    if (hash.includes('type=recovery')) setIsReset(true)

    // Check for upgrade success redirect (?upgrade=success in URL)
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgrade') === 'success') {
      window.history.replaceState(null, '', window.location.pathname)
      // Refresh profile to pick up new premium tier from Stripe webhook
      setTimeout(() => refreshProfile(), 2000)
    }
  }, [])

  if (isLoading) return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 32 }}>✈</div>
    </div>
  )

  // Password reset flow — intercept before auth check
  if (isReset) return (
    <ResetPasswordScreen onDone={() => {
      setIsReset(false)
      window.history.replaceState(null, '', window.location.pathname)
    }} />
  )

  if (!user) return <LoginScreen onSuccess={() => setTab('home')} />

  if (showShare) return (
    <ShareCardScreen
      session={lastSession}
      onHome={() => { setShowShare(false); setTab('home'); setLight() }}
    />
  )

  if (tab === 'boarding' && boarding) return (
    <BoardingPassScreen
      flight={boarding.flight}
      mode={boarding.mode}
      subject={boarding.subject}
      pomoCfg={boarding.pomoCfg}
      wantsChain={boarding.wantsChain}
      onBack={() => { setLight(); setTab('home') }}
      onBoard={async () => {
        await startSession({
          flight:     boarding.flight,
          mode:       boarding.mode,
          seatClass:  'economy',
          subject:    boarding.subject,
          userId:     user.id,
          pomoCfg:    boarding.pomoCfg,
          wantsChain: boarding.wantsChain,
        })
        setTab('live')
      }}
    />
  )

  const handleBoard = (
    flight: Flight,
    mode: StudyMode,
    subject: string,
    pomoCfg?: PomoCfg & { blockCount?: number },
    wantsChain?: boolean
  ) => {
    setBoarding({ flight, mode, subject, pomoCfg, wantsChain })
    setTab('boarding')
  }

  const handleSessionEnd = (session: Session) => {
    if (session) {
      setLastSession(session)
      setShowShare(true)
      setTimeout(() => refreshProfile(), 1500)
    }
  }

  const navigate = (t: Tab) => {
    if (tab === 'live' && t !== 'live') {
      if (activeSession) {
        if (window.confirm('Leave your session? Progress will be saved.')) {
          setLight(); setTab(t)
        }
      } else {
        setLight(); setTab(t)
      }
    } else if (tab === 'boarding' && t !== 'boarding') {
      setLight(); setTab(t)
    } else {
      setTab(t)
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      {tab === 'home'    && <HomeScreen onBoard={handleBoard} onUpgrade={() => setShowUpgrade(true)} />}
      {tab === 'live'    && <LiveSessionScreen onEnd={handleSessionEnd} />}
      {tab === 'crew'    && <CrewScreen />}
      {tab === 'logbook' && <LogbookScreen />}

      <BottomNav
        active={tab === 'boarding' || tab === 'live' ? 'live' : tab as any}
        onNavigate={navigate}
        hasActiveSession={!!activeSession}
      />

      {/* Upgrade modal — shown over any screen */}
      {showUpgrade && <UpgradeScreen onClose={() => setShowUpgrade(false)} />}
    </div>
  )
}