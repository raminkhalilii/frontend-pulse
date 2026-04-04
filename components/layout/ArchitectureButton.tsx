'use client'

import { useState } from 'react'
import { TechStackModal } from '@/components/modals/TechStackModal'

/**
 * Thin client island used by the server-rendered Footer to open the
 * TechStackModal without converting the entire Footer to a client component.
 */
export function ArchitectureButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer text-sm text-slate-500 transition-colors duration-200 hover:text-slate-200"
      >
        View Architecture
      </button>
      <TechStackModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
