/**
 * src/hooks/useFlightPool.ts
 *
 * Manages the pool of available flights.
 * - Fetches real data from OpenSky on mount
 * - Falls back to mock data if API fails
 * - Refreshes every 10 minutes
 * - Filters to free tier (under 2 hours) automatically
 */

import { useState, useEffect, useCallback } from 'react'
import { fetchUSFlights, filterFreeTierPool, pickRandomFlight } from '../api/opensky'
import { MOCK_FREE_POOL } from '../mock/data'
import { USE_MOCK_DATA } from '../utils/config'
import { useAuthStore } from '../store/authStore'
import type { Flight } from '../types'

const REFRESH_INTERVAL_MS = 10 * 60 * 1000  // 10 minutes

interface UseFlightPoolReturn {
  flights:     Flight[]
  isLoading:   boolean
  error:       string | null
  isPremium:   boolean
  random:      () => Flight | null
  refresh:     () => void
  lastFetched: Date | null
}

export function useFlightPool(): UseFlightPoolReturn {
  const [flights, setFlights]         = useState<Flight[]>([])
  const [isLoading, setIsLoading]     = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const { user }                      = useAuthStore()
  const isPremium                     = user?.tier === 'premium'

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 800))
      setFlights(MOCK_FREE_POOL)
      setLastFetched(new Date())
      setIsLoading(false)
      return
    }

    try {
      const all = await fetchUSFlights()
      if (all.length === 0) {
        setFlights(MOCK_FREE_POOL)
        setError('Using demo flights — live data temporarily unavailable')
      } else {
        const pool = isPremium ? all : filterFreeTierPool(all)
        setFlights(pool)
      }
      setLastFetched(new Date())
    } catch (err: any) {
      setFlights(MOCK_FREE_POOL)
      setError('Using demo flights — check your connection')
    } finally {
      setIsLoading(false)
    }
  }, [isPremium])

  // Load on mount
  useEffect(() => { load() }, [load])

  // Refresh every 10 minutes
  useEffect(() => {
    if (USE_MOCK_DATA) return
    const interval = setInterval(load, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [load])

  return {
    flights,
    isLoading,
    error,
    isPremium,
    random: useCallback(() => pickRandomFlight(flights), [flights]),
    refresh: load,
    lastFetched,
  }
}