import React, { useRef, useState, useEffect } from 'react'
import type { OwnedAircraft } from '../api/fleetApi'
import { AIRCRAFT_IMAGES } from '../data/aircraftImages'

interface Props {
  fleet: OwnedAircraft[]
  activeAircraftId: string
  onSelect: (aircraftId: string) => void
  theme: any
}

// Some illustrations are landscape-oriented and need a custom crop focus
// within the portrait card frame so the aircraft itself stays centered
// rather than getting cut off by a naive center-crop.
const IMAGE_FOCUS: Record<string, string> = {
  p51:     'center 40%',
  sr71:    'center 55%',
  concorde:'center 35%',
  zero:    'center 30%',
  dc3:     'center 60%',
}

// Maps aircraft id -> illustration filename in /public/aircraft/
// Falls back to a placeholder gradient if no image exists yet for that id.
// (See src/data/aircraftImages.ts — imported above.)

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

// Quick collectible facts shown in the detail modal — kept short and punchy
const AIRCRAFT_FACTS: Record<string, { firstFlight: string; topSpeed: string; fact: string }> = {
  cessna172:    { firstFlight: '1956', topSpeed: '140 mph',    fact: 'The best-selling aircraft in history, with over 44,000 built.' },
  piper_cub:    { firstFlight: '1938', topSpeed: '87 mph',     fact: 'Taught more pilots to fly than any other aircraft in history.' },
  cub:          { firstFlight: '1938', topSpeed: '87 mph',     fact: 'Taught more pilots to fly than any other aircraft in history.' },
  dc3:          { firstFlight: '1935', topSpeed: '230 mph',    fact: 'Some DC-3s are still flying cargo routes nearly 90 years later.' },
  e175:         { firstFlight: '2003', topSpeed: '530 mph',    fact: 'A regional workhorse connecting smaller cities to major hubs.' },
  b737:         { firstFlight: '1967', topSpeed: '588 mph',    fact: 'The best-selling commercial jet airliner ever produced.' },
  a320:         { firstFlight: '1987', topSpeed: '537 mph',    fact: 'The first airliner with a fully digital fly-by-wire system.' },
  b787:         { firstFlight: '2009', topSpeed: '594 mph',    fact: 'Built largely from lightweight composite materials, not aluminum.' },
  a350:         { firstFlight: '2013', topSpeed: '561 mph',    fact: 'Designed to be 25% more fuel-efficient than the planes it replaced.' },
  b747:         { firstFlight: '1969', topSpeed: '614 mph',    fact: 'Held the title of largest passenger aircraft for 37 years.' },
  a380:         { firstFlight: '2005', topSpeed: '587 mph',    fact: 'The largest passenger airliner ever built, with two full decks.' },
  concorde:     { firstFlight: '1969', topSpeed: '1,354 mph',  fact: 'Could cross the Atlantic in under 3.5 hours — twice the speed of sound.' },
  wright_flyer: { firstFlight: '1903', topSpeed: '30 mph',     fact: 'The first powered, controlled, sustained flight in human history.' },
  wright_b:     { firstFlight: '1910', topSpeed: '40 mph',     fact: 'The first mass-produced airplane, used to train early military pilots.' },
  wright_model_b:{ firstFlight: '1910', topSpeed: '40 mph',    fact: 'The first mass-produced airplane, used to train early military pilots.' },
  spad:         { firstFlight: '1917', topSpeed: '135 mph',    fact: 'Flown by WWI flying ace Eddie Rickenbacker.' },
  spitfire:     { firstFlight: '1936', topSpeed: '370 mph',    fact: 'Its elliptical wing design became instantly iconic.' },
  p51:          { firstFlight: '1940', topSpeed: '440 mph',    fact: 'Escorted bombers deep into enemy territory and back.' },
  zero:         { firstFlight: '1939', topSpeed: '331 mph',    fact: 'Dominated early Pacific air combat with its agility.' },
  bf109:        { firstFlight: '1935', topSpeed: '385 mph',    fact: 'The most produced fighter aircraft in history, over 33,000 built.' },
  b17:          { firstFlight: '1935', topSpeed: '287 mph',    fact: 'Famous for limping home despite catastrophic battle damage.' },
  f86:          { firstFlight: '1947', topSpeed: '687 mph',    fact: 'Dominated the world\'s first jet-versus-jet dogfights over Korea.' },
  f4:           { firstFlight: '1958', topSpeed: '1,473 mph',  fact: 'Held 16 world speed and altitude records when introduced.' },
  sr71:         { firstFlight: '1964', topSpeed: '2,193 mph',  fact: 'Still holds the record for fastest air-breathing manned aircraft.' },
  mig29:        { firstFlight: '1977', topSpeed: '1,520 mph',  fact: 'Built for tight, high-G dogfighting maneuvers.' },
  f22:          { firstFlight: '1997', topSpeed: '1,500 mph',  fact: 'Combines stealth, speed, and agility unmatched by any rival.' },
  b2:           { firstFlight: '1989', topSpeed: '630 mph',    fact: 'Its flying-wing shape makes it nearly invisible to radar.' },
}

export default function FleetCarousel({ fleet, activeAircraftId, onSelect, theme }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [detailAircraft, setDetailAircraft] = useState<OwnedAircraft | null>(null)

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
          padding: '8px calc((100% - min(86%, 340px)) / 2) 4px',
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
                flex: '0 0 86%',
                maxWidth: 340,
                scrollSnapAlign: 'center',
                transform: isFocused ? 'scale(1)' : 'scale(0.88)',
                opacity: isFocused ? 1 : 0.5,
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
                    onClick={() => setDetailAircraft(aircraft)}
                    style={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%',
                      objectFit: 'cover',
                      objectPosition: IMAGE_FOCUS[aircraft.id] ?? 'center center',
                      cursor: 'pointer',
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

      {/* Detail modal — tap a card's image to open */}
      {detailAircraft && (
        <div
          onClick={() => setDetailAircraft(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(5,5,10,0.82)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 380,
              maxHeight: '88vh', overflowY: 'auto',
              borderRadius: 24,
              background: theme.bgCard,
              border: `2px solid ${(RARITY_STYLE[detailAircraft.rarity] ?? RARITY_STYLE.economy).frame}`,
              boxShadow: `0 30px 60px -10px rgba(0,0,0,0.5)`,
            }}
          >
            {(() => {
              const img = AIRCRAFT_IMAGES[detailAircraft.id]
              const rarity = RARITY_STYLE[detailAircraft.rarity] ?? RARITY_STYLE.economy
              const facts = AIRCRAFT_FACTS[detailAircraft.id]
              return (
                <>
                  <div style={{ position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden', borderRadius: '22px 22px 0 0' }}>
                    {img ? (
                      <img src={img} alt={detailAircraft.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: `linear-gradient(160deg, ${rarity.frame}55, #1a1a24 70%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, opacity: 0.5 }}>✈</div>
                    )}
                    <button
                      onClick={() => setDetailAircraft(null)}
                      style={{
                        position: 'absolute', top: 12, right: 12,
                        width: 32, height: 32, borderRadius: '50%',
                        border: 'none', background: 'rgba(0,0,0,0.5)', color: '#fff',
                        fontSize: 16, cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: '#0c0c14', background: rarity.label, padding: '3px 9px', borderRadius: 20, textTransform: 'uppercase' }}>
                        {detailAircraft.rarity}
                      </span>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: theme.text, letterSpacing: -0.4 }}>{detailAircraft.name}</div>
                    <div style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
                      {detailAircraft.manufacturer} · {ERA_LABELS[detailAircraft.era] ?? detailAircraft.era}
                    </div>

                    {detailAircraft.description && (
                      <div style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.6, marginTop: 12 }}>
                        {detailAircraft.description}
                      </div>
                    )}

                    {facts && (
                      <>
                        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                          <div style={{ flex: 1, background: theme.bgCardAlt, borderRadius: 12, padding: '10px 12px' }}>
                            <div style={{ fontSize: 9, color: theme.textTertiary, letterSpacing: 0.5, marginBottom: 3 }}>FIRST FLIGHT</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{facts.firstFlight}</div>
                          </div>
                          <div style={{ flex: 1, background: theme.bgCardAlt, borderRadius: 12, padding: '10px 12px' }}>
                            <div style={{ fontSize: 9, color: theme.textTertiary, letterSpacing: 0.5, marginBottom: 3 }}>TOP SPEED</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{facts.topSpeed}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: theme.textTertiary, lineHeight: 1.6, marginTop: 12, fontStyle: 'italic' }}>
                          {facts.fact}
                        </div>
                      </>
                    )}

                    <button
                      onClick={() => {
                        onSelect(detailAircraft.id)
                        setDetailAircraft(null)
                      }}
                      disabled={detailAircraft.id === activeAircraftId}
                      style={{
                        marginTop: 18, width: '100%', padding: '12px 0',
                        borderRadius: 12, border: 'none',
                        background: detailAircraft.id === activeAircraftId ? theme.bgCardAlt : rarity.frame,
                        color: detailAircraft.id === activeAircraftId ? theme.textTertiary : '#0c0c14',
                        fontSize: 13, fontWeight: 700,
                        cursor: detailAircraft.id === activeAircraftId ? 'default' : 'pointer',
                      }}
                    >
                      {detailAircraft.id === activeAircraftId ? '✓ Currently flying' : 'Fly this aircraft'}
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

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