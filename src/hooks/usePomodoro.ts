import { useState, useEffect, useRef, useCallback } from 'react'
import { POMODORO_LONG_BREAK_AFTER, SEAT_CLASS_CONFIG } from '../utils/config'
import type { PomodoroState, SeatClass } from '../types'

export interface PomoCfg {
  workMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  blockCount?: number
}

interface Options {
  seatClass: SeatClass
  totalSessionMinutes: number
  customConfig?: PomoCfg
  onBlockComplete?: (block: number) => void
  onSessionComplete?: () => void
}

export function usePomodoro({
  seatClass,
  totalSessionMinutes,
  customConfig,
  onBlockComplete,
  onSessionComplete,
}: Options) {
  // Use custom config if provided, otherwise fall back to seat class defaults
  const config = customConfig ?? SEAT_CLASS_CONFIG[seatClass]

  const blockCycle =
    config.workMinutes * POMODORO_LONG_BREAK_AFTER +
    config.shortBreakMinutes * (POMODORO_LONG_BREAK_AFTER - 1) +
    config.longBreakMinutes

  // Use explicit blockCount if provided, otherwise calculate from flight duration
  const totalBlocks = customConfig?.blockCount
    ? customConfig.blockCount
    : Math.max(
        1,
        Math.floor((totalSessionMinutes / blockCycle) * POMODORO_LONG_BREAK_AFTER)
      )

  const initial: PomodoroState = {
    phase: 'work',
    currentBlock: 1,
    totalBlocks,
    secondsRemaining: config.workMinutes * 60,
    completedBlocks: 0,
  }

  const [state, setState]     = useState<PomodoroState>(initial)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef           = useRef<ReturnType<typeof setInterval> | null>(null)

  const getNext = useCallback(
    (cur: PomodoroState): PomodoroState => {
      if (cur.phase === 'work') {
        const completed = cur.completedBlocks + 1
        onBlockComplete?.(completed)
        if (completed >= cur.totalBlocks) {
          onSessionComplete?.()
          return { ...cur, completedBlocks: completed }
        }
        const isLong = completed % POMODORO_LONG_BREAK_AFTER === 0
        // If long break is 0 minutes, skip it and go to short break instead
        const phase = isLong && config.longBreakMinutes > 0 ? 'longBreak' : 'shortBreak'
        const breakMins = phase === 'longBreak' ? config.longBreakMinutes : config.shortBreakMinutes
        return {
          ...cur,
          completedBlocks: completed,
          phase,
          secondsRemaining: breakMins * 60,
        }
      }
      return {
        ...cur,
        phase: 'work',
        currentBlock: cur.currentBlock + 1,
        secondsRemaining: config.workMinutes * 60,
      }
    },
    [config, onBlockComplete, onSessionComplete]
  )

  useEffect(() => {
    if (!isRunning) return
    intervalRef.current = setInterval(() => {
      setState(prev =>
        prev.secondsRemaining <= 1
          ? getNext(prev)
          : { ...prev, secondsRemaining: prev.secondsRemaining - 1 }
      )
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, getNext])

  return {
    state,
    isRunning,
    start: () => setIsRunning(true),
    pause: () => setIsRunning(false),
    skip:  () => setState(prev => getNext(prev)),
  }
}