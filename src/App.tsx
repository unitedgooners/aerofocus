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
import HangarScreen from './screens/HangarScreen'
import { useUpgradeStore } from './store/upgradeStore'
import BottomNav from './components/BottomNav'
import type { Flight, Session, StudyMode } from './types'
import type { PomoCfg } from './hooks/usePomodoro'

type Tab = 'home' | 'boarding' | 'live' | 'crew' | 'logbook' | 'hangar'

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
  const { isTemporarilyPremium, justUpgraded, checkDailyRoll, dismissCelebration } = useUpgradeStore()

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

  // Roll for a random daily upgrade once the user is loaded
  useEffect(() => {
    if (user?.id && user.tier === 'free') {
      checkDailyRoll(user.id)
    }
  }, [user?.id])

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

  if (tab === 'hangar') return (
    <HangarScreen onBack={() => setTab('home')} />
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
    } else if (tab === 'boarding' && t !== tab) {
      setLight(); setTab(t)
    } else {
      setTab(t)
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      {tab === 'home'    && <HomeScreen onBoard={handleBoard} onUpgrade={() => setShowUpgrade(true)} onHangar={() => setTab('hangar')} />}
      {tab === 'live'    && <LiveSessionScreen onEnd={handleSessionEnd} />}
      {tab === 'crew'    && <CrewScreen />}
      {tab === 'logbook' && <LogbookScreen />}

      <BottomNav
        active={tab === 'boarding' || tab === 'live' ? 'live' : (tab as 'home' | 'crew' | 'logbook')}
        onNavigate={navigate}
        hasActiveSession={!!activeSession}
      />

      {/* Upgrade modal — shown over any screen */}
      {showUpgrade && <UpgradeScreen onClose={() => setShowUpgrade(false)} />}

      {/* Random upgrade celebration — shown once when the daily roll succeeds */}
      {justUpgraded && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(13,2,33,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: 24,
        }}>
          <div style={{
            background: '#1A0533',
            border: '1px solid #9D4EDD',
            borderRadius: 20,
            padding: '32px 24px',
            textAlign: 'center',
            maxWidth: 380,
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: -0.5, marginBottom: 8 }}>
              You've been upgraded!
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 20 }}>
              Enjoy 24 hours of First Class — every premium feature unlocked,
              plus an exclusive boarding pass design. On us.
            </div>
            <button onClick={dismissCelebration} style={{
              width: '100%', padding: 14, borderRadius: 12, border: 'none',
              background: '#9D4EDD', color: '#fff',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>
              Let's fly ✈
            </button>
          </div>
        </div>
      )}
    </div>
  )
}