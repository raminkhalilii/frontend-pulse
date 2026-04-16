'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error'
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 3500

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, type: ToastItem['type'] = 'success') => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
    },
    [dismiss],
  )

  return { toasts, toast, dismiss }
}

// ─── Container ────────────────────────────────────────────────────────────────

interface ToastContainerProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    // Sits above mobile bottom nav (h-16) + a little breathing room
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 md:bottom-6"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            role="alert"
            initial={{ opacity: 0, x: 48, scale: 0.96 }}
            animate={{ opacity: 1, x: 0,  scale: 1    }}
            exit={{    opacity: 0, x: 48, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className={[
              'flex items-center gap-3 rounded-xl border px-4 py-3',
              'text-sm font-medium shadow-lg backdrop-blur-xl',
              t.type === 'success'
                ? 'border-pulse-green/20 bg-emerald-950/90 text-emerald-300'
                : 'border-pulse-red/20   bg-red-950/90    text-red-300',
            ].join(' ')}
          >
            {t.type === 'success' ? (
              <CheckCircle size={15} className="flex-none" aria-hidden="true" />
            ) : (
              <XCircle size={15} className="flex-none" aria-hidden="true" />
            )}

            <span className="flex-1">{t.message}</span>

            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss notification"
              className="ml-1 cursor-pointer opacity-60 transition-opacity hover:opacity-100"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
