/**
 * theme.ts
 *
 * Single source of truth for all colors, spacing, and typography.
 * Two themes: LIGHT (gate / cabin lights on) and DARK (in flight / lights off).
 *
 * Usage:
 *   import { useTheme } from '../styles/theme'
 *   const t = useTheme()
 *   <div style={{ background: t.bg, color: t.text }}>
 */

export type Theme = Omit<typeof LIGHT, 'mode'> & { mode: 'light' | 'dark' | 'hangar' }

export const LIGHT = {
  // Backgrounds
  bg:           '#F6F7FB',
  bgCard:       '#FFFFFF',
  bgCardAlt:    '#EEF1F7',
  bgInput:      '#FFFFFF',
  bgPrimary:    '#155FD1',   // CTA blue — sharpened, more saturated
  bgSuccess:    'rgba(22,134,98,0.10)',
  bgWarning:    'rgba(186,117,23,0.10)',
  bgDanger:     'rgba(162,45,45,0.10)',

  // Text
  text:         '#161B26',
  textSecondary:'rgba(22,27,38,0.56)',
  textTertiary: 'rgba(22,27,38,0.32)',
  textOnDark:   '#FFFFFF',
  textSuccess:  '#168662',
  textWarning:  '#BA7517',
  textDanger:   '#A22D2D',
  textAccent:   '#155FD1',

  // Borders
  border:       'rgba(22,27,38,0.08)',
  borderMed:    'rgba(22,27,38,0.14)',
  borderStrong: 'rgba(22,27,38,0.24)',

  // Accent colors (progress bars, chips, badges)
  accent:       '#155FD1',
  accentAlt:    '#168662',
  accentAmber:  '#BA7517',

  // Gradient pair for hero/flight cards — the one place we allow a gradient
  gradientFrom: '#1B6FE8',
  gradientTo:   '#0E3F94',

  // Nav
  navBg:        '#FFFFFF',
  navBorder:    'rgba(22,27,38,0.08)',
  navActive:    '#155FD1',
  navInactive:  'rgba(22,27,38,0.36)',

  // Mode label
  mode: 'light' as const,
}

export const DARK = {
  bg:           '#07111F',
  bgCard:       '#0D1E35',
  bgCardAlt:    '#112240',
  bgInput:      '#0D1E35',
  bgPrimary:    '#185FA5',
  bgSuccess:    'rgba(56,180,139,0.12)',
  bgWarning:    'rgba(239,159,39,0.12)',
  bgDanger:     'rgba(226,75,74,0.12)',

  text:         '#E8EEF7',
  textSecondary:'rgba(232,238,247,0.55)',
  textTertiary: 'rgba(232,238,247,0.28)',
  textOnDark:   '#FFFFFF',
  textSuccess:  '#38b48b',
  textWarning:  '#EF9F27',
  textDanger:   '#F09595',
  textAccent:   '#85B7EB',

  border:       'rgba(232,238,247,0.07)',
  borderMed:    'rgba(232,238,247,0.12)',
  borderStrong: 'rgba(232,238,247,0.22)',

  accent:       '#185FA5',
  accentAlt:    '#38b48b',
  accentAmber:  '#EF9F27',

  gradientFrom: '#1B6FE8',
  gradientTo:   '#08203F',

  navBg:        '#07111F',
  navBorder:    'rgba(232,238,247,0.07)',
  navActive:    '#85B7EB',
  navInactive:  'rgba(232,238,247,0.30)',

  mode: 'dark' as const,
}

// HANGAR — a third, distinct theme used only inside The Hangar screen.
// Concrete walls, a single warm work-light glow — meant to feel like a
// physically different place from the cabin (cabin = LIGHT/DARK above).
export const HANGAR = {
  bg:           '#26282C',
  bgCard:       '#34373C',
  bgCardAlt:    '#3E4146',
  bgInput:      '#3E4146',
  bgPrimary:    '#FFC95C',   // work-light amber, used sparingly as the one accent

  bgSuccess:    'rgba(95,196,255,0.12)',
  bgWarning:    'rgba(255,201,92,0.14)',
  bgDanger:     'rgba(226,75,74,0.14)',

  text:         '#F0EDE4',
  textSecondary:'rgba(240,237,228,0.58)',
  textTertiary: 'rgba(240,237,228,0.34)',
  textOnDark:   '#FFFFFF',
  textSuccess:  '#7CC9FF',
  textWarning:  '#FFC95C',
  textDanger:   '#F09595',
  textAccent:   '#FFC95C',

  border:       'rgba(240,237,228,0.08)',
  borderMed:    'rgba(240,237,228,0.14)',
  borderStrong: 'rgba(240,237,228,0.24)',

  accent:       '#FFC95C',
  accentAlt:    '#7CC9FF',
  accentAmber:  '#FFC95C',

  gradientFrom: '#3E4146',
  gradientTo:   '#1C1E21',

  navBg:        '#26282C',
  navBorder:    'rgba(240,237,228,0.08)',
  navActive:    '#FFC95C',
  navInactive:  'rgba(240,237,228,0.34)',

  mode: 'hangar' as const,
}

// Spacing scale
export const space = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
}

// Border radius
export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  pill: 999,
}

// Typography
export const font = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   22,
  xxl:  28,
  hero: 56,
}

// Font families — a characterful display face for headlines/numbers (loaded
// via Google Fonts in index.html), paired with the system sans for body/UI text.
export const fontFamily = {
  display: "'Fraunces', Georgia, serif",   // headlines, big numbers, the boarding pass
  body:    "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  hangar:  "'JetBrains Mono', 'Courier New', monospace", // stenciled/industrial feel inside The Hangar
}