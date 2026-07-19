'use client'

/**
 * Shared toggle/switch component.
 *
 * Matches the existing toggle pattern used in AlertChannelRow and QuietHoursSection.
 * Uses `left-` positioning (not transform) so the thumb never overshoots.
 *
 * Size math (thumb stays inside track at all times):
 *
 *   sm  track 36×20px  thumb 14×14px  OFF: left-0.5 (2px)  ON: left-[18px]
 *       → ON = 36 − 2 borders − 14 thumb − 2 right gap = 18px ✓
 *
 *   md  track 44×24px  thumb 18×18px  OFF: left-0.5 (2px)  ON: left-[22px]
 *       → ON = 44 − 2 borders − 18 thumb − 2 right gap = 22px ✓
 */

interface ToggleProps {
  id?: string
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  size?: 'sm' | 'md'
  disabled?: boolean
}

const SIZES = {
  sm: {
    track: 'h-5 w-9',
    thumb: 'h-3.5 w-3.5 top-0.5',
    onLeft:  'left-[18px]',
    offLeft: 'left-0.5',
  },
  md: {
    track: 'h-6 w-11',
    thumb: 'h-[18px] w-[18px] top-0.5',
    onLeft:  'left-[22px]',
    offLeft: 'left-0.5',
  },
}

export function Toggle({
  id,
  checked,
  onChange,
  label,
  size = 'sm',
  disabled = false,
}: ToggleProps) {
  const { track, thumb, onLeft, offLeft } = SIZES[size]

  const button = (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={[
        'flex cursor-pointer items-center gap-2 transition-opacity',
        disabled ? 'pointer-events-none opacity-50' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={[
          'relative rounded-full border transition-all duration-200',
          track,
          checked
            ? 'border-pulse-green/40 bg-pulse-green/20'
            : 'border-white/[0.08] bg-white/[0.05]',
        ].join(' ')}
        aria-hidden="true"
      >
        <div
          className={[
            'absolute rounded-full transition-all duration-200',
            thumb,
            checked ? `${onLeft} bg-pulse-green` : `${offLeft} bg-slate-500`,
          ].join(' ')}
        />
      </div>
    </button>
  )

  if (!label) return button

  return (
    <label
      className={[
        'flex cursor-pointer items-center gap-3',
        disabled ? 'opacity-50' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {button}
      <span className="text-sm text-slate-300">{label}</span>
    </label>
  )
}
