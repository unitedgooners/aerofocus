import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { space, radius, font, fontFamily, HANGAR } from '../styles/theme'
import { fetchUserFleet, FREE_TIER_AIRCRAFT_LIMIT, type OwnedAircraft } from '../api/fleetApi'
import { useActiveAircraftStore } from '../store/activeAircraftStore'
import { useEffectivePremium } from '../hooks/useEffectivePremium'
import FleetCarousel from '../components/FleetCarousel'

interface Props {
  onBack: () => void
  onUpgrade: () => void
}

// The Hangar is now Fleet-only — a focused space for browsing and flying your
// owned aircraft. Shop (buying aircraft/themes) lives in its own ShopScreen,
// using the regular cabin theme instead of the Hangar's industrial look.
export default function HangarScreen({ onBack, onUpgrade }: Props) {
  const { user } = useAuthStore()
  const theme     = HANGAR // The Hangar always uses its own theme, independent of cabin lighting
  const { activeAircraftId, load: loadAircraft, setActiveAircraft } = useActiveAircraftStore()
  const isPremium = useEffectivePremium()

  const [fleet, setFleet]       = useState<OwnedAircraft[]>([])
  const [isLoading, setLoading] = useState(true)
  const [toast, setToast]       = useState('')

  const load = async () => {
    if (!user) return
    setLoading(true)
    const f = await fetchUserFleet(user.id)
    setFleet(f)
    await loadAircraft(user.id)
    setLoading(false)
  }

  useEffect(() => { load() }, [user?.id])

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse 480px 380px at 50% -40px, rgba(255,201,92,0.10), transparent 70%), ${theme.bg}`,
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: `${space.xl}px ${space.lg}px 100px` }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: space.md, marginBottom: space.lg }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: fontFamily.display, fontSize: 26, fontWeight: 600,
              color: theme.text, letterSpacing: -0.3,
            }}>
              The Hangar
            </div>
            <div style={{ fontSize: font.xs, color: theme.textSecondary, marginTop: 2, letterSpacing: 0.3 }}>
              {isPremium ? 'Your fleet, your collection' : `Your fleet, your collection · ${fleet.length}/${FREE_TIER_AIRCRAFT_LIMIT} owned`}
            </div>
          </div>
          <div style={{
            background: 'rgba(255,201,92,0.14)', color: theme.textWarning,
            padding: '6px 14px', borderRadius: radius.sm,
            fontSize: font.sm, fontWeight: 700,
            border: '0.5px solid rgba(255,201,92,0.25)',
          }}>
            ${(user?.cashBalance ?? 0).toFixed(2)}
          </div>
        </div>

        {/* Upgrade prompt — free users only */}
        {!isPremium && (
          <button
            onClick={onUpgrade}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: space.md,
              background: `linear-gradient(135deg, ${theme.bgCard}, ${theme.bgCardAlt})`,
              border: `0.5px solid rgba(255,201,92,0.3)`,
              borderRadius: radius.lg, padding: `${space.md}px ${space.lg}px`,
              marginBottom: space.lg, cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 22 }}>🔓</span>
            <span style={{ fontSize: font.xs, color: theme.text, lineHeight: 1.4, fontWeight: 600 }}>
              Want more aircraft? <span style={{ color: theme.textWarning }}>Upgrade to Premium</span> to unlock the full store.
            </span>
          </button>
        )}

        {/* Toast */}
        {toast && (
          <div style={{
            background: theme.bgSuccess, color: theme.textSuccess,
            borderRadius: radius.md, padding: `${space.sm}px ${space.md}px`,
            fontSize: font.xs, marginBottom: space.md, textAlign: 'center', fontWeight: 600,
          }}>
            {toast}
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: space.xxl, color: theme.textTertiary, fontSize: font.sm }}>
            Loading hangar...
          </div>
        ) : (
          <FleetCarousel
            fleet={fleet}
            theme={theme}
            activeAircraftId={activeAircraftId}
            onSelect={async (aircraftId) => {
              if (!user) return
              await setActiveAircraft(user.id, aircraftId)
              setToast('✓ Now flying this aircraft')
              setTimeout(() => setToast(''), 1500)
            }}
          />
        )}

      </div>
    </div>
  )
}