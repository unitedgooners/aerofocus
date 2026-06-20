import React, { useState } from 'react'
import { useThemeStore } from '../store/themeStore'
import { useAuthStore } from '../store/authStore'
import { space, radius, font, fontFamily } from '../styles/theme'

interface Props {
  onBack: () => void
  onAccountDeleted: () => void
  onOpenLegal: (doc: 'privacy' | 'terms') => void
}

export default function SettingsScreen({ onBack, onAccountDeleted, onOpenLegal }: Props) {
  const { theme }  = useThemeStore()
  const { user, logout, deleteAccount } = useAuthStore()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [confirmText, setConfirmText]               = useState('')
  const [deleting, setDeleting]                     = useState(false)
  const [error, setError]                           = useState('')

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') return
    setDeleting(true)
    setError('')

    const result = await deleteAccount()

    if (result.success) {
      onAccountDeleted()
    } else {
      setError(result.error ?? 'Something went wrong. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: theme.bg, overflowY: 'auto', transition: 'background 0.6s ease' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: `${space.xl}px ${space.lg}px 100px` }}>

        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: theme.textTertiary,
          fontSize: font.sm, cursor: 'pointer', padding: 0, marginBottom: space.lg,
        }}>
          ← Back
        </button>

        <div style={{
          fontFamily: fontFamily.display, fontSize: 26, fontWeight: 600,
          color: theme.text, letterSpacing: -0.3, marginBottom: space.xl,
        }}>
          Settings
        </div>

        {/* Account info */}
        <div style={{
          background: theme.bgCard, borderRadius: radius.lg, border: `0.5px solid ${theme.border}`,
          padding: space.lg, marginBottom: space.lg,
        }}>
          <div style={{ fontSize: font.xs, fontWeight: 600, color: theme.textTertiary, letterSpacing: 1, marginBottom: space.sm }}>
            ACCOUNT
          </div>
          <div style={{ fontSize: font.sm, color: theme.text, fontWeight: 600 }}>{user?.username}</div>
          <div style={{ fontSize: font.xs, color: theme.textTertiary, marginTop: 2 }}>{user?.email}</div>
        </div>

        {/* Legal links */}
        <div style={{
          background: theme.bgCard, borderRadius: radius.lg, border: `0.5px solid ${theme.border}`,
          marginBottom: space.lg, overflow: 'hidden',
        }}>
          {[
            { label: 'Privacy Policy', doc: 'privacy' as const },
            { label: 'Terms of Service', doc: 'terms' as const },
          ].map((item, i) => (
            <button
              key={item.label}
              onClick={() => onOpenLegal(item.doc)}
              style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: `${space.md}px ${space.lg}px`,
                borderTop: i > 0 ? `0.5px solid ${theme.border}` : 'none',
                border: 'none', borderTopWidth: i > 0 ? '0.5px' : 0,
                background: 'none', textAlign: 'left',
                color: theme.text, fontSize: font.sm, fontWeight: 500, cursor: 'pointer',
              }}
            >
              {item.label}
              <span style={{ color: theme.textTertiary }}>›</span>
            </button>
          ))}
        </div>

        {/* Log out */}
        <button onClick={logout} style={{
          width: '100%', padding: 14, borderRadius: radius.lg,
          border: `0.5px solid ${theme.borderMed}`,
          background: theme.bgCard, color: theme.text,
          fontSize: font.sm, fontWeight: 600, cursor: 'pointer',
          marginBottom: space.xl,
        }}>
          Log out
        </button>

        {/* Danger zone */}
        <div style={{ fontSize: font.xs, fontWeight: 600, color: theme.textDanger, letterSpacing: 1, marginBottom: space.sm }}>
          DANGER ZONE
        </div>

        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} style={{
            width: '100%', padding: 14, borderRadius: radius.lg,
            border: `0.5px solid ${theme.textDanger}40`,
            background: 'transparent', color: theme.textDanger,
            fontSize: font.sm, fontWeight: 600, cursor: 'pointer',
          }}>
            Delete account
          </button>
        ) : (
          <div style={{
            background: theme.bgDanger, borderRadius: radius.lg,
            border: `0.5px solid ${theme.textDanger}40`,
            padding: space.lg,
          }}>
            <div style={{ fontSize: font.sm, fontWeight: 700, color: theme.textDanger, marginBottom: space.xs }}>
              This can't be undone
            </div>
            <div style={{ fontSize: font.xs, color: theme.textDanger, opacity: 0.85, lineHeight: 1.5, marginBottom: space.md }}>
              Deleting your account permanently removes your profile, fleet, study sessions, cash balance, and everything else tied to your account. This happens immediately and cannot be reversed.
            </div>

            <div style={{ fontSize: font.xs, color: theme.textDanger, fontWeight: 600, marginBottom: space.xs }}>
              Type DELETE to confirm
            </div>
            <input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="DELETE"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: radius.md,
                border: `0.5px solid ${theme.textDanger}50`, background: theme.bgInput,
                color: theme.text, fontSize: font.sm, outline: 'none', marginBottom: space.md,
              }}
            />

            {error && (
              <div style={{ fontSize: font.xs, color: theme.textDanger, marginBottom: space.md }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: space.sm }}>
              <button
                onClick={() => { setShowDeleteConfirm(false); setConfirmText(''); setError('') }}
                style={{
                  flex: 1, padding: 12, borderRadius: radius.md,
                  border: `0.5px solid ${theme.borderMed}`,
                  background: 'transparent', color: theme.textSecondary,
                  fontSize: font.sm, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText.trim().toUpperCase() !== 'DELETE' || deleting}
                style={{
                  flex: 1, padding: 12, borderRadius: radius.md, border: 'none',
                  background: confirmText.trim().toUpperCase() === 'DELETE' ? '#A22D2D' : theme.bgCardAlt,
                  color: confirmText.trim().toUpperCase() === 'DELETE' ? '#fff' : theme.textTertiary,
                  fontSize: font.sm, fontWeight: 700,
                  cursor: confirmText.trim().toUpperCase() === 'DELETE' && !deleting ? 'pointer' : 'not-allowed',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? 'Deleting...' : 'Delete forever'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}