import { create } from 'zustand'
import { supabase } from '../api/supabase'
import { fetchUserFleet, type OwnedAircraft } from '../api/fleetApi'

interface ActiveAircraftState {
  fleet:           OwnedAircraft[]
  activeAircraftId: string
  isLoading:       boolean
  load:            (userId: string) => Promise<void>
  setActiveAircraft: (userId: string, aircraftId: string) => Promise<void>
}

export const useActiveAircraftStore = create<ActiveAircraftState>((set, get) => ({
  fleet:            [],
  activeAircraftId: 'cessna172',
  isLoading:        false,

  load: async (userId: string) => {
    set({ isLoading: true })
    const fleet = await fetchUserFleet(userId)

    const { data } = await supabase
      .from('profiles')
      .select('active_aircraft_id')
      .eq('id', userId)
      .maybeSingle()

    set({
      fleet,
      activeAircraftId: data?.active_aircraft_id ?? 'cessna172',
      isLoading: false,
    })
  },

  setActiveAircraft: async (userId: string, aircraftId: string) => {
    const owned = get().fleet.some(a => a.id === aircraftId)
    if (!owned) return

    set({ activeAircraftId: aircraftId })
    await supabase
      .from('profiles')
      .update({ active_aircraft_id: aircraftId })
      .eq('id', userId)
  },
}))