import { useAuthStore } from '../store/authStore'
import { useUpgradeStore } from '../store/upgradeStore'

/**
 * Returns true if the user should be treated as premium right now —
 * either because they have a paid subscription, or because they're
 * within a temporary 24-hour random upgrade window.
 */
export function useEffectivePremium(): boolean {
  const { user } = useAuthStore()
  const { isTemporarilyPremium } = useUpgradeStore()

  return user?.tier === 'premium' || isTemporarilyPremium
}