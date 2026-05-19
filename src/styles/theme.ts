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

export type Theme = typeof LIGHT

export const LIGHT = {
  // Backgrounds
  bg:           '#F5F7FA',
  bgCard:       '#FFFFFF',
  bgCardAlt:    '#EEF1F6',
  bgInput:      '#FFFFFF',
  bgPrimary:    '#185FA5',   // CTA blue
  bgSuccess:    'rgba(27,126,96,0.10)',
  bgWarning:    'rgba(186,117,23,0.10)',
  bgDanger:     'rgba(162,45,45,0.10)',

  // Text
  text:         '#1A2233',
  textSecondary:'rgba(26,34,51,0.55)',
  textTertiary: 'rgba(26,34,51,0.30)',
  textOnDark:   '#FFFFFF',
  textSuccess:  '#1B7E60',
  textWarning:  '#BA7517',
  textDanger:   '#A22D2D',
  textAccent:   '#185FA5',

  // Borders
  border:       'rgba(26,34,51,0.09)',
  borderMed:    'rgba(26,34,51,0.15)',
  borderStrong: 'rgba(26,34,51,0.25)',

  // Accent colors (progress bars, chips, badges)
  accent:       '#185FA5',
  accentAlt:    '#1B7E60',
  accentAmber:  '#BA7517',

  // Nav
  navBg:        '#FFFFFF',
  navBorder:    'rgba(26,34,51,0.08)',
  navActive:    '#185FA5',
  navInactive:  'rgba(26,34,51,0.35)',

  // Mode label
  mode: 'light' as 'light' | 'dark',
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

  navBg:        '#07111F',
  navBorder:    'rgba(232,238,247,0.07)',
  navActive:    '#85B7EB',
  navInactive:  'rgba(232,238,247,0.30)',

  mode: 'dark' as 'light' | 'dark',
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