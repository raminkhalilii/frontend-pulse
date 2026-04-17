'use client'

import { useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Dialog ───────────────────────────────────────────────────────────────────

interface UnsavedChangesDialogProps {
  onStay: () => void
  onLeave: () => void
}

function UnsavedChangesDialog({ onStay, onLeave }: UnsavedChangesDialogProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onStay()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onStay])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onStay}
        aria-hidden="true"
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
        className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.07] to-white/[0.03] p-6 shadow-2xl backdrop-blur-xl"
      >
        <h2
          id="unsaved-dialog-title"
          className="mb-1 text-base font-semibold text-white"
        >
          You have unsaved changes
        </h2>
        <p className="mb-6 text-sm text-slate-400">
          Are you sure you want to leave? Your changes will be lost.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onStay}
            className="cursor-pointer rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-white/[0.08] hover:text-white"
          >
            Stay
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="cursor-pointer rounded-lg border border-pulse-red/30 bg-pulse-red/10 px-4 py-2 text-sm font-medium text-pulse-red transition-all duration-200 hover:bg-pulse-red/20"
          >
            Leave anyway
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Guards navigation when there are unsaved changes.
 *
 * Usage:
 *   const { guardNavigation, GuardDialog } = useUnsavedChangesGuard(isDirty)
 *
 *   // Wrap all navigation actions:
 *   <button onClick={() => guardNavigation(() => router.push('/dashboard'))}>
 *     Back
 *   </button>
 *
 *   // Render the dialog at root level of your page:
 *   <GuardDialog />
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null)

  // ── Browser close / reload / external navigation ─────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return
      e.preventDefault()
      // Modern spec: just set returnValue to any string. The browser shows its own message.
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // ── In-app navigation guard ───────────────────────────────────────────────
  /**
   * Call this before any programmatic navigation.
   * If there are no unsaved changes, callback runs immediately.
   * Otherwise, a confirmation dialog is shown first.
   */
  const guardNavigation = useCallback(
    (callback: () => void) => {
      if (!isDirty) {
        callback()
        return
      }
      // Store the callback so the dialog can invoke it on "Leave anyway"
      setPendingCallback(() => callback)
    },
    [isDirty],
  )

  function handleStay() {
    setPendingCallback(null)
  }

  function handleLeave() {
    const cb = pendingCallback
    setPendingCallback(null)
    cb?.()
  }

  const GuardDialog = (
    <AnimatePresence>
      {pendingCallback !== null && (
        <UnsavedChangesDialog onStay={handleStay} onLeave={handleLeave} />
      )}
    </AnimatePresence>
  )

  return { guardNavigation, GuardDialog }
}
