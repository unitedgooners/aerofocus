// Boarding pass color presets — mirrors boarding_pass_themes seed data in Supabase.
// Used by both BoardingPassScreen and ShareCardScreen so purchased themes
// apply consistently everywhere a boarding pass is rendered.

export interface PassColors {
  bg:        string  // page / outer background
  accent:    string  // stub background, accent highlights
  text:      string  // text on accent/stub background
  paper:     string  // "ticket paper" background (top half)
  paperText: string  // text on paper background
}

export const PASS_THEMES: Record<string, PassColors> = {
  default:  { bg: '#0a1628', accent: '#185FA5', text: '#ffffff', paper: '#ffffff', paperText: '#1A2233' },
  concorde: { bg: '#3A2A1A', accent: '#D4622E', text: '#F5EFE0', paper: '#F5EFE0', paperText: '#1A1A1A' },
  first:    { bg: '#000000', accent: '#D4AF37', text: '#ffffff', paper: '#0A0A0A', paperText: '#F5EFE0' },
  redeye:   { bg: '#1A0505', accent: '#FF3B30', text: '#ffffff', paper: '#1A0505', paperText: '#F5EFE0' },
  founder:  { bg: '#1A1410', accent: '#C9A227', text: '#F5EFE0', paper: '#F5EFE0', paperText: '#1A1410' },
  upgraded: { bg: '#0D0221', accent: '#9D4EDD', text: '#ffffff', paper: '#F4EBFF', paperText: '#1A0533' },
}

export function getPassColors(themeId: string): PassColors {
  return PASS_THEMES[themeId] ?? PASS_THEMES.default
}