import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { space, radius, font } from '../styles/theme'
import {
  fetchAircraftCatalog,
  fetchUserFleet,
  buyAircraft,
  fetchThemeCatalog,
  buyTheme,
  type AircraftModel,
  type OwnedAircraft,
  type BoardingPassTheme,
} from '../api/fleetApi'
import { useBoardingPassThemeStore } from '../store/boardingPassThemeStore'

interface Props {
  onBack: () => void
}

const RARITY_COLORS: Record<string, { bg: string; text: string }> = {
  starter:  { bg: 'rgba(150,150,150,0.15)', text: '#999999' },
  economy:  { bg: 'rgba(56,180,139,0.15)',   text: '#38b48b' },
  business: { bg: 'rgba(24,95,165,0.15)',    text: '#185FA5' },
  first:    { bg: 'rgba(212,175,55,0.15)',   text: '#D4AF37' },
  legendary:{ bg: 'rgba(168,85,247,0.15)',   text: '#A855F7' },
  founder:  { bg: 'rgba(201,162,39,0.18)',   text: '#C9A227' },
}

const ERA_LABELS: Record<string, string> = {
  vintage:   'Vintage',
  classic:   'Classic',
  modern:    'Modern',
  'wide-body': 'Wide-body',
}

export default function HangarScreen({ onBack }: Props) {
  const { user, refreshProfile } = useAuthStore()
  const { theme }                = useThemeStore()
  const { ownedThemes, activeThemeId, load: loadThemes, setActiveTheme } = useBoardingPassThemeStore()

  const [catalog, setCatalog]       = useState<AircraftModel[]>([])
  const [fleet, setFleet]           = useState<OwnedAircraft[]>([])
  const [themeCatalog, setThemeCatalog] = useState<BoardingPassTheme[]>([])
  const [isLoading, setLoading]     = useState(true)
  const [tab, setTab]               = useState<'fleet' | 'shop' | 'themes'>('fleet')
  const [buying, setBuying]         = useState<string | null>(null)
  const [toast, setToast]           = useState('')

  const load = async () => {
    if (!user) return
    setLoading(true)
    const [c, f, t] = await Promise.all([
      fetchAircraftCatalog(),
      fetchUserFleet(user.id),
      fetchThemeCatalog(),
    ])
    setCatalog(c)
    setFleet(f)
    setThemeCatalog(t)
    await loadThemes(user.id)
    setLoading(false)
  }

  useEffect(() => { load() }, [user?.id])

  const ownedIds = new Set(fleet.map(a => a.id))

  const ownedThemeIds = new Set(['default', ...ownedThemes.map(t => t.id)])

  const handleBuyTheme = async (themeItem: BoardingPassTheme) => {
    if (!user || themeItem.price === null) return
    setBuying(themeItem.id)

    const result = await buyTheme(user.id, themeItem.id, themeItem.price, user.cashBalance)

    if (result.success) {
      setToast(`✓ ${themeItem.name} unlocked!`)
      await refreshProfile()
      await load()
    } else {
      setToast(result.error === 'Not enough cash' ? "You don't have enough cash for this" : 'Purchase failed')
    }

    setBuying(null)
    setTimeout(() => setToast(''), 2500)
  }

  const handleSelectTheme = async (themeId: string) => {
    if (!user) return
    await setActiveTheme(user.id, themeId)
    setToast('✓ Boarding pass theme updated')
    setTimeout(() => setToast(''), 1500)
  }

  const handleBuy = async (aircraft: AircraftModel) => {
    if (!user || aircraft.price === null) return
    setBuying(aircraft.id)

    const result = await buyAircraft(user.id, aircraft.id, aircraft.price, user.cashBalance)

    if (result.success) {
      setToast(`✓ ${aircraft.name} added to your fleet!`)
      await refreshProfile()
      await load()
    } else {
      setToast(result.error === 'Not enough cash' ? "You don't have enough cash for this" : 'Purchase failed')
    }

    setBuying(null)
    setTimeout(() => setToast(''), 2500)
  }

  // Sort shop: purchasable first by price, founder-only items at the end
  const shopItems = [...catalog]
    .filter(a => a.rarity !== 'starter')
    .sort((a, b) => {
      if (a.price === null && b.price !== null) return 1
      if (a.price !== null && b.price === null) return -1
      return (a.price ?? 0) - (b.price ?? 0)
    })

  // Sort theme shop the same way
  const themeShopItems = [...themeCatalog]
    .filter(t => t.rarity !== 'starter')
    .sort((a, b) => {
      if (a.price === null && b.price !== null) return 1
      if (a.price !== null && b.price === null) return -1
      return (a.price ?? 0) - (b.price ?? 0)
    })

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, transition: 'background 0.6s ease' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: `${space.xl}px ${space.lg}px 100px` }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: space.md, marginBottom: space.lg }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: font.xl, fontWeight: 700, color: theme.text, letterSpacing: -0.5 }}>Hangar</div>
            <div style={{ fontSize: font.xs, color: theme.textSecondary, marginTop: 2 }}>Your fleet, your collection</div>
          </div>
          <div style={{ background: theme.bgSuccess, color: theme.textSuccess, padding: '6px 14px', borderRadius: radius.pill, fontSize: font.sm, fontWeight: 700 }}>
            ${(user?.cashBalance ?? 0).toFixed(2)}
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', background: theme.bgCardAlt,
          borderRadius: radius.lg, padding: 4, marginBottom: space.lg,
          border: `0.5px solid ${theme.border}`,
        }}>
          {(['fleet', 'shop', 'themes'] as const).map(t => {
            const active = tab === t
            const count  = t === 'fleet' ? fleet.length
                         : t === 'shop'  ? shopItems.filter(a => !ownedIds.has(a.id)).length
                         : themeShopItems.filter(th => !ownedThemeIds.has(th.id)).length
            const label  = t === 'fleet' ? 'Fleet' : t === 'shop' ? 'Shop' : 'Themes'
            return (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '10px', borderRadius: radius.md, border: 'none',
                background: active ? theme.bgCard : 'transparent',
                color: active ? theme.text : theme.textTertiary,
                fontSize: font.sm, fontWeight: active ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {label} ({count})
              </button>
            )
          })}
        </div>

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
        ) : tab === 'fleet' ? (
          <FleetGrid fleet={fleet} theme={theme} />
        ) : tab === 'shop' ? (
          <ShopGrid
            items={shopItems}
            ownedIds={ownedIds}
            balance={user?.cashBalance ?? 0}
            buying={buying}
            onBuy={handleBuy}
            theme={theme}
          />
        ) : (
          <ThemeGrid
            items={themeCatalog}
            ownedIds={ownedThemeIds}
            activeThemeId={activeThemeId}
            balance={user?.cashBalance ?? 0}
            buying={buying}
            onBuy={handleBuyTheme}
            onSelect={handleSelectTheme}
            theme={theme}
          />
        )}

      </div>
    </div>
  )
}

// ── Fleet grid — owned aircraft ──────────────────────────────────────────────────
function FleetGrid({ fleet, theme }: { fleet: OwnedAircraft[]; theme: any }) {
  if (fleet.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: space.xxl, color: theme.textTertiary }}>
        <div style={{ fontSize: 40, marginBottom: space.md }}>🛩</div>
        <div style={{ fontSize: font.sm }}>Your hangar is empty</div>
      </div>
    )
  }

  // Sort: founder items first, then by sortOrder
  const sorted = [...fleet].sort((a, b) => {
    if (a.rarity === 'founder' && b.rarity !== 'founder') return -1
    if (a.rarity !== 'founder' && b.rarity === 'founder') return 1
    return a.sortOrder - b.sortOrder
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
      {sorted.map(aircraft => {
        const rarity = RARITY_COLORS[aircraft.rarity] ?? RARITY_COLORS.economy
        return (
          <div key={aircraft.id} style={{
            background: theme.bgCard, borderRadius: radius.lg,
            border: aircraft.rarity === 'founder' ? `1px solid ${rarity.text}` : `0.5px solid ${theme.border}`,
            padding: space.lg,
            position: 'relative', overflow: 'hidden',
          }}>
            {aircraft.rarity === 'founder' && (
              <div style={{
                position: 'absolute', top: 0, right: 0,
                background: rarity.text, color: '#1A1410',
                fontSize: 9, fontWeight: 700, letterSpacing: 1,
                padding: '3px 10px', borderBottomLeftRadius: radius.sm,
              }}>
                FOUNDER
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space.sm }}>
              <div>
                <div style={{ fontSize: font.md, fontWeight: 700, color: theme.text, letterSpacing: -0.3 }}>{aircraft.name}</div>
                <div style={{ fontSize: font.xs, color: theme.textTertiary, marginTop: 2 }}>
                  {aircraft.manufacturer} · {ERA_LABELS[aircraft.era] ?? aircraft.era}
                </div>
              </div>
              <div style={{ background: rarity.bg, color: rarity.text, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: radius.pill, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {aircraft.rarity}
              </div>
            </div>
            <div style={{ fontSize: font.xs, color: theme.textSecondary, lineHeight: 1.5, marginBottom: space.sm }}>
              {aircraft.description}
            </div>
            <div style={{ display: 'flex', gap: space.sm, alignItems: 'center' }}>
              {aircraft.flownIrl && (
                <span style={{ fontSize: 10, color: theme.textSuccess, fontWeight: 600 }}>✓ Flown</span>
              )}
              <span style={{ fontSize: 10, color: theme.textTertiary }}>
                {aircraft.source === 'starter' ? 'Starter aircraft' :
                 aircraft.source === 'founder' ? 'Founder reward' :
                 aircraft.source === 'referral' ? 'Referral reward' :
                 `Acquired ${new Date(aircraft.acquiredAt).toLocaleDateString()}`}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Shop grid — purchasable aircraft ─────────────────────────────────────────────
function ShopGrid({
  items, ownedIds, balance, buying, onBuy, theme,
}: {
  items: AircraftModel[]
  ownedIds: Set<string>
  balance: number
  buying: string | null
  onBuy: (a: AircraftModel) => void
  theme: any
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
      {items.map(aircraft => {
        const owned       = ownedIds.has(aircraft.id)
        const rarity      = RARITY_COLORS[aircraft.rarity] ?? RARITY_COLORS.economy
        const isFounder   = aircraft.price === null
        const canAfford   = aircraft.price !== null && balance >= aircraft.price

        return (
          <div key={aircraft.id} style={{
            background: theme.bgCard, borderRadius: radius.lg,
            border: `0.5px solid ${theme.border}`,
            padding: space.lg,
            opacity: owned ? 0.55 : 1,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space.sm }}>
              <div>
                <div style={{ fontSize: font.md, fontWeight: 700, color: theme.text, letterSpacing: -0.3 }}>{aircraft.name}</div>
                <div style={{ fontSize: font.xs, color: theme.textTertiary, marginTop: 2 }}>
                  {aircraft.manufacturer} · {ERA_LABELS[aircraft.era] ?? aircraft.era}
                </div>
              </div>
              <div style={{ background: rarity.bg, color: rarity.text, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: radius.pill, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {aircraft.rarity}
              </div>
            </div>
            <div style={{ fontSize: font.xs, color: theme.textSecondary, lineHeight: 1.5, marginBottom: space.md }}>
              {aircraft.description}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {owned ? (
                <span style={{ fontSize: font.xs, color: theme.textSuccess, fontWeight: 600 }}>✓ In your fleet</span>
              ) : isFounder ? (
                <span style={{ fontSize: font.xs, color: theme.textTertiary, fontStyle: 'italic' }}>Not for sale — earned only</span>
              ) : (
                <span style={{ fontSize: font.lg, fontWeight: 700, color: theme.text, letterSpacing: -0.5 }}>
                  ${aircraft.price?.toFixed(0)}
                </span>
              )}

              {!owned && !isFounder && (
                <button
                  onClick={() => onBuy(aircraft)}
                  disabled={!canAfford || buying === aircraft.id}
                  style={{
                    padding: '8px 20px', borderRadius: radius.md, border: 'none',
                    background: canAfford ? theme.bgPrimary : theme.bgCardAlt,
                    color: canAfford ? '#fff' : theme.textTertiary,
                    fontSize: font.xs, fontWeight: 700,
                    cursor: canAfford && buying !== aircraft.id ? 'pointer' : 'not-allowed',
                    opacity: buying === aircraft.id ? 0.6 : 1,
                  }}
                >
                  {buying === aircraft.id ? 'Buying...' : canAfford ? 'Buy' : 'Not enough cash'}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Theme grid — boarding pass styles ─────────────────────────────────────────────
function ThemeGrid({
  items, ownedIds, activeThemeId, balance, buying, onBuy, onSelect, theme,
}: {
  items: BoardingPassTheme[]
  ownedIds: Set<string>
  activeThemeId: string
  balance: number
  buying: string | null
  onBuy: (t: BoardingPassTheme) => void
  onSelect: (themeId: string) => void
  theme: any
}) {
  const all = [...items].sort((a, b) => {
    if (a.id === 'default') return -1
    if (b.id === 'default') return 1
    if (a.price === null && b.price !== null) return 1
    if (a.price !== null && b.price === null) return -1
    return (a.price ?? 0) - (b.price ?? 0)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
      {all.map(t => {
        const owned     = ownedIds.has(t.id)
        const isActive  = activeThemeId === t.id
        const isFounder = t.price === null && t.id !== 'default'
        const canAfford = t.price !== null && balance >= t.price
        const colors    = t.previewColors

        return (
          <div key={t.id} style={{
            background: theme.bgCard, borderRadius: radius.lg,
            border: isActive ? `1px solid ${theme.bgPrimary}` : `0.5px solid ${theme.border}`,
            padding: space.lg,
          }}>
            <div style={{ display: 'flex', gap: space.md, alignItems: 'center', marginBottom: space.sm }}>
              {/* Color swatch preview */}
              <div style={{
                width: 48, height: 32, borderRadius: radius.sm,
                background: colors.bg, border: `1px solid ${colors.accent}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <div style={{ width: 18, height: 3, borderRadius: 2, background: colors.accent }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
                  <div style={{ fontSize: font.md, fontWeight: 700, color: theme.text, letterSpacing: -0.3 }}>{t.name}</div>
                  {isActive && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: theme.textSuccess, background: theme.bgSuccess, padding: '2px 8px', borderRadius: radius.pill, letterSpacing: 0.5 }}>ACTIVE</span>
                  )}
                  {t.rarity === 'founder' && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#C9A227', background: 'rgba(201,162,39,0.18)', padding: '2px 8px', borderRadius: radius.pill, letterSpacing: 0.5 }}>FOUNDER</span>
                  )}
                </div>
                <div style={{ fontSize: font.xs, color: theme.textSecondary, marginTop: 2 }}>{t.description}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: space.sm }}>
              {owned ? (
                <button
                  onClick={() => onSelect(t.id)}
                  disabled={isActive}
                  style={{
                    padding: '8px 20px', borderRadius: radius.md, border: 'none',
                    background: isActive ? theme.bgCardAlt : theme.bgPrimary,
                    color: isActive ? theme.textTertiary : '#fff',
                    fontSize: font.xs, fontWeight: 700,
                    cursor: isActive ? 'default' : 'pointer',
                  }}
                >
                  {isActive ? 'Applied' : 'Apply'}
                </button>
              ) : isFounder ? (
                <span style={{ fontSize: font.xs, color: theme.textTertiary, fontStyle: 'italic' }}>Founder exclusive</span>
              ) : (
                <>
                  <span style={{ fontSize: font.lg, fontWeight: 700, color: theme.text, letterSpacing: -0.5, alignSelf: 'center', marginRight: 'auto' }}>
                    ${t.price?.toFixed(0)}
                  </span>
                  <button
                    onClick={() => onBuy(t)}
                    disabled={!canAfford || buying === t.id}
                    style={{
                      padding: '8px 20px', borderRadius: radius.md, border: 'none',
                      background: canAfford ? theme.bgPrimary : theme.bgCardAlt,
                      color: canAfford ? '#fff' : theme.textTertiary,
                      fontSize: font.xs, fontWeight: 700,
                      cursor: canAfford && buying !== t.id ? 'pointer' : 'not-allowed',
                      opacity: buying === t.id ? 0.6 : 1,
                    }}
                  >
                    {buying === t.id ? 'Buying...' : canAfford ? 'Buy' : 'Not enough cash'}
                  </button>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}