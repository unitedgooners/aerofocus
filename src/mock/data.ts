import type { Flight, Session, UserProfile, CrewMember } from '../types'

export const MOCK_FLIGHTS: Flight[] = [
  {
    id: 'UA924', icao24: 'a1b2c3', airline: 'United Airlines',
    origin: 'EWR', originCity: 'Newark',
    destination: 'FCO', destinationCity: 'Rome',
    departureTime: new Date(Date.now() - 4 * 3600000).toISOString(),
    estimatedArrival: new Date(Date.now() + 5 * 3600000).toISOString(),
    remainingMinutes: 312, lat: 51.23, lng: -30.11, altitude: 38000,
    status: 'airborne', lastUpdated: new Date().toISOString(),
  },
  {
    id: 'DL402', icao24: 'd4e5f6', airline: 'Delta Airlines',
    origin: 'ATL', originCity: 'Atlanta',
    destination: 'LAX', destinationCity: 'Los Angeles',
    departureTime: new Date(Date.now() - 2 * 3600000).toISOString(),
    estimatedArrival: new Date(Date.now() + 1.5 * 3600000).toISOString(),
    remainingMinutes: 92, lat: 35.1, lng: -105.4, altitude: 36000,
    status: 'airborne', lastUpdated: new Date().toISOString(),
  },
  {
    id: 'AA100', icao24: 'a7b8c9', airline: 'American Airlines',
    origin: 'JFK', originCity: 'New York',
    destination: 'LHR', destinationCity: 'London',
    departureTime: new Date(Date.now() - 1 * 3600000).toISOString(),
    estimatedArrival: new Date(Date.now() + 6 * 3600000).toISOString(),
    remainingMinutes: 378, lat: 48.2, lng: -42.8, altitude: 37000,
    status: 'airborne', lastUpdated: new Date().toISOString(),
  },
  {
    id: 'WN556', icao24: 'b1c2d3', airline: 'Southwest',
    origin: 'DAL', originCity: 'Dallas Love',
    destination: 'MDW', destinationCity: 'Chicago Midway',
    departureTime: new Date(Date.now() - 0.5 * 3600000).toISOString(),
    estimatedArrival: new Date(Date.now() + 1 * 3600000).toISOString(),
    remainingMinutes: 58, lat: 37.2, lng: -91.3, altitude: 34000,
    status: 'airborne', lastUpdated: new Date().toISOString(),
  },
  {
    id: 'BA178', icao24: 'e4f5a6', airline: 'British Airways',
    origin: 'LHR', originCity: 'London',
    destination: 'ORD', destinationCity: 'Chicago',
    departureTime: new Date(Date.now() - 5 * 3600000).toISOString(),
    estimatedArrival: new Date(Date.now() + 2 * 3600000).toISOString(),
    remainingMinutes: 118, lat: 52.4, lng: -65.7, altitude: 39000,
    status: 'airborne', lastUpdated: new Date().toISOString(),
  },
  {
    id: 'WN889', icao24: 'c7d8e9', airline: 'Southwest',
    origin: 'BNA', originCity: 'Nashville',
    destination: 'DEN', destinationCity: 'Denver',
    departureTime: new Date(Date.now() - 0.75 * 3600000).toISOString(),
    estimatedArrival: new Date(Date.now() + 1.25 * 3600000).toISOString(),
    remainingMinutes: 74, lat: 36.8, lng: -98.2, altitude: 35000,
    status: 'airborne', lastUpdated: new Date().toISOString(),
  },
]

export const MOCK_FREE_POOL = MOCK_FLIGHTS.filter(f => f.remainingMinutes <= 120)

export const MOCK_USER: UserProfile = {
  id: 'mock-user-001',
  username: 'aviator_student',
  tier: 'free',
  homeAirport: 'ATL',
  streakDays: 12,
  totalFocusMinutes: 2832,
  totalFlights: 31,
  totalDistanceKm: 28440,
  createdAt: new Date(Date.now() - 60 * 24 * 3600000).toISOString(),
}

export const MOCK_SESSIONS: Session[] = [
  {
    id: 'session-001', userId: MOCK_USER.id, flightId: 'UA924',
    flight: MOCK_FLIGHTS[0], mode: 'pomodoro', seatClass: 'economy',
    subject: 'Organic Chemistry',
    startedAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
    endedAt: new Date(Date.now() - 2 * 24 * 3600000 + 7.2 * 3600000).toISOString(),
    focusedMinutes: 432, distanceCoveredKm: 8240, pomodorosCompleted: 14,
    status: 'landed',
  },
  {
    id: 'session-002', userId: MOCK_USER.id, flightId: 'DL402',
    flight: MOCK_FLIGHTS[1], mode: 'traditional', seatClass: 'economy',
    subject: 'Bar Exam Prep',
    startedAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
    endedAt: new Date(Date.now() - 1 * 24 * 3600000 + 2.75 * 3600000).toISOString(),
    focusedMinutes: 164, distanceCoveredKm: 2840, pomodorosCompleted: 0,
    status: 'landed',
  },
]

export const MOCK_CREW: CrewMember[] = [
  {
    userId: 'crew-001', username: 'jamie_m',
    currentSession: {
      id: 'cs-001', userId: 'crew-001', flightId: 'AA100',
      flight: MOCK_FLIGHTS[2], mode: 'pomodoro', seatClass: 'economy',
      startedAt: new Date(Date.now() - 45 * 60000).toISOString(),
      focusedMinutes: 45, distanceCoveredKm: 420, pomodorosCompleted: 1,
      status: 'active',
    },
  },
  {
    userId: 'crew-002', username: 'anika_k',
    currentSession: {
      id: 'cs-002', userId: 'crew-002', flightId: 'UA924',
      flight: MOCK_FLIGHTS[0], mode: 'traditional', seatClass: 'business',
      startedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      focusedMinutes: 120, distanceCoveredKm: 1840, pomodorosCompleted: 0,
      status: 'active',
    },
  },
  { userId: 'crew-003', username: 'tom_r', lastSession: MOCK_SESSIONS[0] },
]

export function simulateFlightUpdate(flight: Flight): Flight {
  const newRemaining = Math.max(0, flight.remainingMinutes - 1)
  const isTaxiing    = newRemaining <= 0
  return {
    ...flight,
    lat:              isTaxiing ? flight.lat : flight.lat + (Math.random() - 0.5) * 0.5,
    lng:              isTaxiing ? flight.lng : flight.lng + (Math.random() - 0.5) * 0.5,
    remainingMinutes: newRemaining,
    altitude:         isTaxiing ? 0 : flight.altitude,
    status:           isTaxiing ? 'landed' : 'airborne',
    lastUpdated:      new Date().toISOString(),
  }
}