import React, { useRef, useState, useEffect } from 'react'
import type { OwnedAircraft } from '../api/fleetApi'

interface Props {
  fleet: OwnedAircraft[]
  activeAircraftId: string
  onSelect: (aircraftId: string) => void
  theme: any
}

// Maps aircraft id -> illustration filename in /public/aircraft/
// Falls back to a placeholder gradient if no image exists yet for that id.
const AIRCRAFT_IMAGES: Record<string, string> = {
  cessna172:      '/aircraft/cessna172.png',
  piper_cub:      '/aircraft/piper_cub.png',
  cub:            '/aircraft/piper_cub.png',
  dc3:            '/aircraft/dc3.png',
  e175:           '/aircraft/e175.png',
  b737:           '/aircraft/b737.png',
  a320:           '/aircraft/a320.png',
  b787:           '/aircraft/b787.png',
  a350:           '/aircraft/a350.png',
  b747:           '/aircraft/b747.png',
  a380:           '/aircraft/a380.png',
  concorde:       '/aircraft/concorde.png',
  wright_flyer:   '/aircraft/wright_flyer.png',
  wright_b:       '/aircraft/wright_model_b.png',
  wright_model_b: '/aircraft/wright_model_b.png',
  spad:           '/aircraft/spad.png',
  spitfire:       '/aircraft/spitfire.png',
  p51:            '/aircraft/p51.png',
  zero:           '/aircraft/zero.png',
  bf109:          '/aircraft/bf109.png',
  b17:            '/aircraft/b17.png',
  f86:            '/aircraft/f86.png',
  f4:             '/aircraft/f4.png',
  sr71:           '/aircraft/sr71.png',
  mig29:          '/aircraft/mig29.png',
  f22:            '/aircraft/f22.png',
  b2:             '/aircraft/b2.png',
}

// Rarity-tinted frame + foil treatment for the card border and holo sweep
const RARITY_STYLE: Record<string, { frame: string; glow: string; foilA: string; foilB: string; label: string }> = {
  starter:   { frame: '#6B7280', glow: 'rgba(107,114,128,0.35)', foilA: 'rgba(255,255,255,0.08)', foilB: 'rgba(255,255,255,0)', label: '#9CA3AF' },
  economy:   { frame: '#3FA66B', glow: 'rgba(63,166,107,0.35)',  foilA: 'rgba(255,255,255,0.10)', foilB: 'rgba(255,255,255,0)', label: '#5FCB8C' },
  business:  { frame: '#2E7DC4', glow: 'rgba(46,125,196,0.4)',   foilA: 'rgba(255,255,255,0.12)', foilB: 'rgba(255,255,255,0)', label: '#5BA6E8' },
  first:     { frame: '#D4AF37', glow: 'rgba(212,175,55,0.45)',  foilA: 'rgba(255,250,220,0.22)', foilB: 'rgba(255,255,255,0)', label: '#E8CB5C' },
  legendary: { frame: '#A855F7', glow: 'rgba(168,85,247,0.55)',  foilA: 'rgba(230,200,255,0.3)',  foilB: 'rgba(120,200,255,0.12)', label: '#C58CFA' },
  founder:   { frame: '#C9A227', glow: 'rgba(201,162,39,0.55)',  foilA: 'rgba(255,235,180,0.32)', foilB: 'rgba(255,200,120,0.14)', label: '#E8C95A' },
}

const ERA_LABELS: Record<string, string> = {
  wwi: 'WWI', wwii: 'WWII', korea: 'Korean War', vietnam: 'Vietnam War',
  coldwar: 'Cold War', modern: 'Modern', vintage: 'Vintage', classic: 'Classic',
  'wide-body': 'Wide-body',
}

export default function FleetCarousel({ fleet, activeAircraftId, onSelect, theme }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Keep the carousel's "centered" card in sync with scroll position,
  // used to scale/dim neighboring cards for the peek effect. Finds whichever
  // card's center is closest to the track's visible center — robust to the
  // maxWidth cap on wide viewports where a fixed cardWidth estimate drifts.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const onScroll = () => {
      const trackRect = track.getBoundingClientRect()
      const trackCenter = trackRect.left + trackRect.width / 2

      let closestIdx = 0
      let closestDist = Infinity

      Array.from(track.children).forEach((child, i) => {
        const rect = (child as HTMLElement).getBoundingClientRect()
        const cardCenter = rect.left + rect.width / 2
        const dist = Math.abs(cardCenter - trackCenter)
        if (dist < closestDist) {
          closestDist = dist
          closestIdx = i
        }
      })

      setActiveIndex(closestIdx)
    }

    track.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => track.removeEventListener('scroll', onScroll)
  }, [fleet.length])

  const scrollToIndex = (idx: number) => {
    const track = trackRef.current
    if (!track) return
    const card = track.children[idx] as HTMLElement
    if (card) {
      track.scrollTo({ left: card.offsetLeft - (track.offsetWidth - card.offsetWidth) / 2, behavior: 'smooth' })
    }
  }

  if (fleet.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', color: theme.textTertiary, fontSize: 13 }}>
        Your fleet is empty. Visit the Shop to add aircraft.
      </div>
    )
  }

  return (
    <div style={{ margin: '0 -20px' }}>
      <div
        ref={trackRef}
        style={{
          display: 'flex',
          gap: 16,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          padding: '8px 20px 4px',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
        className="fleet-carousel-track"
      >
        {fleet.map((aircraft, i) => {
          const rarity   = RARITY_STYLE[aircraft.rarity] ?? RARITY_STYLE.economy
          const isActive = aircraft.id === activeAircraftId
          const isFocused = i === activeIndex
          const img = AIRCRAFT_IMAGES[aircraft.id]

          return (
            <div
              key={aircraft.id}
              style={{
                flex: '0 0 78%',
                maxWidth: 280,
                scrollSnapAlign: 'center',
                transform: isFocused ? 'scale(1)' : 'scale(0.91)',
                opacity: isFocused ? 1 : 0.55,
                transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease',
              }}
            >
              <div style={{
                position: 'relative',
                borderRadius: 20,
                overflow: 'hidden',
                aspectRatio: '2 / 3',
                background: '#0c0c14',
                border: `2px solid ${rarity.frame}`,
                boxShadow: isFocused
                  ? `0 0 0 1px ${rarity.frame}55, 0 18px 40px -8px ${rarity.glow}, 0 8px 16px rgba(0,0,0,0.35)`
                  : '0 8px 20px rgba(0,0,0,0.25)',
              }}>

                {/* Illustration */}
                {img ? (
                  <img
                    src={img}
                    alt={aircraft.name}
                    style={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(160deg, ${rarity.frame}55, #1a1a24 70%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 48, opacity: 0.5,
                  }}>
                    ✈
                  </div>
                )}

                {/* Foil sweep for rare tiers */}
                {(aircraft.rarity === 'legendary' || aircraft.rarity === 'founder') && (
                  <div
                    className="fleet-card-foil"
                    style={{
                      position: 'absolute', inset: 0,
                      background: `linear-gradient(115deg, transparent 30%, ${rarity.foilA} 48%, ${rarity.foilB} 52%, transparent 70%)`,
                      mixBlendMode: 'screen',
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Top gradient for rarity label legibility */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 64,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)',
                }} />

                {/* Rarity + founder badge */}
                <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: 1,
                    color: '#0c0c14', background: rarity.label,
                    padding: '3px 9px', borderRadius: 20, textTransform: 'uppercase',
                  }}>
                    {aircraft.rarity}
                  </span>
                </div>

                {isActive && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                    color: '#0c0c14', background: '#ffffff',
                    padding: '3px 9px', borderRadius: 20,
                  }}>
                    ✓ FLYING
                  </div>
                )}

                {/* Bottom info plate */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '28px 14px 14px',
                  background: 'linear-gradient(to top, rgba(5,5,10,0.92) 35%, rgba(5,5,10,0.55) 70%, transparent 100%)',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: -0.3, lineHeight: 1.15 }}>
                    {aircraft.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>
                    {aircraft.manufacturer} · {ERA_LABELS[aircraft.era] ?? aircraft.era}
                  </div>

                  <button
                    onClick={() => onSelect(aircraft.id)}
                    disabled={isActive}
                    style={{
                      marginTop: 10,
                      width: '100%',
                      padding: '9px 0',
                      borderRadius: 10,
                      border: isActive ? `1px solid rgba(255,255,255,0.25)` : 'none',
                      background: isActive ? 'transparent' : rarity.frame,
                      color: isActive ? 'rgba(255,255,255,0.6)' : '#0c0c14',
                      fontSize: 12, fontWeight: 700,
                      cursor: isActive ? 'default' : 'pointer',
                    }}
                  >
                    {isActive ? '✓ Currently flying' : 'Fly this aircraft'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Dot pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
        {fleet.map((aircraft, i) => (
          <button
            key={aircraft.id}
            onClick={() => scrollToIndex(i)}
            aria-label={`View ${aircraft.name}`}
            style={{
              width: i === activeIndex ? 18 : 6,
              height: 6,
              borderRadius: 3,
              border: 'none',
              padding: 0,
              background: i === activeIndex ? theme.text : theme.border,
              opacity: i === activeIndex ? 1 : 0.6,
              transition: 'all 0.25s ease',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      <style>{`
        .fleet-carousel-track::-webkit-scrollbar { display: none; }
        @keyframes foilSweep {
          0%   { background-position: -120% 0; }
          100% { background-position: 220% 0; }
        }
        .fleet-card-foil {
          background-size: 250% 100%;
          animation: foilSweep 3.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}