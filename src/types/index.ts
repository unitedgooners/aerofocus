export type FlightStatus = 'airborne' | 'landed'
export type StudyMode = 'traditional' | 'pomodoro' | 'flowtime'
export type SeatClass = 'economy' | 'business' | 'first'
export type SessionStatus = 'active' | 'landed' | 'aborted'
export type SubscriptionTier = 'free' | 'premium'
export type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak'

export interface Flight {
  id: string
  icao24: string
  airline: string
  origin: string
  originCity: string
  destination: string
  destinationCity: string
  departureTime: string
  estimatedArrival: string
  remainingMinutes: number
  lat: number
  lng: number
  altitude: number
  heading?: number
  status: FlightStatus
  lastUpdated: string
}

export interface Session {
  id: string
  userId: string
  flightId: string
  flight: Flight
  mode: StudyMode
  seatClass: SeatClass
  subject?: string
  startedAt: string
  endedAt?: string
  focusedMinutes: number
  distanceCoveredKm: number
  pomodorosCompleted: number
  status: SessionStatus
}

export interface PomodoroState {
  phase: PomodoroPhase
  currentBlock: number
  totalBlocks: number
  secondsRemaining: number
  completedBlocks: number
}

export interface UserProfile {
  id: string
  username: string
  tier: SubscriptionTier
  homeAirport?: string
  streakDays: number
  totalFocusMinutes: number
  totalFlights: number
  totalDistanceKm: number
  cashBalance: number        // ← add this
  referralCode: string       // ← add this
  signupNumber: number | null // ← add this
  createdAt: string
}

export interface CrewMember {
  userId: string
  username: string
  currentSession?: Session
  lastSession?: Session
}