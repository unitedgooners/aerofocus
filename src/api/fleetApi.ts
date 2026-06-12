import { supabase } from './supabase'

export interface AircraftModel {
  id: string
  name: string
  manufacturer: string
  era: string
  rarity: 'starter' | 'economy' | 'business' | 'first' | 'legendary' | 'founder'
  price: number | null
  description: string
  icaoCodes: string[]
  sortOrder: number
}

export interface OwnedAircraft extends AircraftModel {
  acquiredAt: string
  flownIrl: boolean
  source: string
}

export interface BoardingPassTheme {
  id: string
  name: string
  description: string
  rarity: string
  price: number | null
  previewColors: { bg: string; accent: string; text: string }
}

export interface OwnedTheme extends BoardingPassTheme {
  acquiredAt: string
}

// ── Fetch the full aircraft catalog ─────────────────────────────────────────────
export async function fetchAircraftCatalog(): Promise<AircraftModel[]> {
  const { data, error } = await supabase
    .from('aircraft_models')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error || !data) return []

  return data.map(row => ({
    id:           row.id,
    name:         row.name,
    manufacturer: row.manufacturer,
    era:          row.era,
    rarity:       row.rarity,
    price:        row.price !== null ? Number(row.price) : null,
    description:  row.description,
    icaoCodes:    row.icao_codes ?? [],
    sortOrder:    row.sort_order ?? 0,
  }))
}

// ── Fetch a user's owned fleet (joined with catalog data) ──────────────────────
export async function fetchUserFleet(userId: string): Promise<OwnedAircraft[]> {
  const { data, error } = await supabase
    .from('user_fleet')
    .select('aircraft_id, acquired_at, flown_irl, source, aircraft_models(*)')
    .eq('user_id', userId)

  if (error || !data) return []

  return data
    .filter((row: any) => row.aircraft_models)
    .map((row: any) => ({
      id:           row.aircraft_models.id,
      name:         row.aircraft_models.name,
      manufacturer: row.aircraft_models.manufacturer,
      era:          row.aircraft_models.era,
      rarity:       row.aircraft_models.rarity,
      price:        row.aircraft_models.price !== null ? Number(row.aircraft_models.price) : null,
      description:  row.aircraft_models.description,
      icaoCodes:    row.aircraft_models.icao_codes ?? [],
      sortOrder:    row.aircraft_models.sort_order ?? 0,
      acquiredAt:   row.acquired_at,
      flownIrl:     row.flown_irl ?? false,
      source:       row.source,
    }))
}

// ── Buy an aircraft (deducts cash, adds to fleet) ───────────────────────────────
export async function buyAircraft(
  userId: string,
  aircraftId: string,
  price: number,
  currentBalance: number
): Promise<{ success: boolean; error?: string }> {
  if (currentBalance < price) {
    return { success: false, error: 'Not enough cash' }
  }

  // Check not already owned
  const { data: existing } = await supabase
    .from('user_fleet')
    .select('aircraft_id')
    .eq('user_id', userId)
    .eq('aircraft_id', aircraftId)
    .maybeSingle()

  if (existing) {
    return { success: false, error: 'Already owned' }
  }

  // Deduct cash
  const { error: balanceError } = await supabase
    .from('profiles')
    .update({ cash_balance: Math.round((currentBalance - price) * 100) / 100 })
    .eq('id', userId)

  if (balanceError) return { success: false, error: 'Failed to update balance' }

  // Add to fleet
  const { error: fleetError } = await supabase
    .from('user_fleet')
    .insert({ user_id: userId, aircraft_id: aircraftId, source: 'purchase' })

  if (fleetError) {
    // Roll back balance deduction
    await supabase.from('profiles').update({ cash_balance: currentBalance }).eq('id', userId)
    return { success: false, error: 'Failed to add to fleet' }
  }

  return { success: true }
}

// ── Boarding pass themes ────────────────────────────────────────────────────────
export async function fetchThemeCatalog(): Promise<BoardingPassTheme[]> {
  const { data, error } = await supabase
    .from('boarding_pass_themes')
    .select('*')

  if (error || !data) return []

  return data.map(row => ({
    id:            row.id,
    name:          row.name,
    description:   row.description,
    rarity:        row.rarity,
    price:         row.price !== null ? Number(row.price) : null,
    previewColors: row.preview_colors ?? { bg: '#07111F', accent: '#38b48b', text: '#ffffff' },
  }))
}

export async function fetchUserThemes(userId: string): Promise<OwnedTheme[]> {
  const { data, error } = await supabase
    .from('user_themes')
    .select('theme_id, acquired_at, boarding_pass_themes(*)')
    .eq('user_id', userId)

  if (error || !data) return []

  return data
    .filter((row: any) => row.boarding_pass_themes)
    .map((row: any) => ({
      id:            row.boarding_pass_themes.id,
      name:          row.boarding_pass_themes.name,
      description:   row.boarding_pass_themes.description,
      rarity:        row.boarding_pass_themes.rarity,
      price:         row.boarding_pass_themes.price !== null ? Number(row.boarding_pass_themes.price) : null,
      previewColors: row.boarding_pass_themes.preview_colors ?? { bg: '#07111F', accent: '#38b48b', text: '#ffffff' },
      acquiredAt:    row.acquired_at,
    }))
}

export async function buyTheme(
  userId: string,
  themeId: string,
  price: number,
  currentBalance: number
): Promise<{ success: boolean; error?: string }> {
  if (currentBalance < price) {
    return { success: false, error: 'Not enough cash' }
  }

  const { data: existing } = await supabase
    .from('user_themes')
    .select('theme_id')
    .eq('user_id', userId)
    .eq('theme_id', themeId)
    .maybeSingle()

  if (existing) {
    return { success: false, error: 'Already owned' }
  }

  const { error: balanceError } = await supabase
    .from('profiles')
    .update({ cash_balance: Math.round((currentBalance - price) * 100) / 100 })
    .eq('id', userId)

  if (balanceError) return { success: false, error: 'Failed to update balance' }

  const { error: themeError } = await supabase
    .from('user_themes')
    .insert({ user_id: userId, theme_id: themeId })

  if (themeError) {
    await supabase.from('profiles').update({ cash_balance: currentBalance }).eq('id', userId)
    return { success: false, error: 'Failed to add theme' }
  }

  return { success: true }
}