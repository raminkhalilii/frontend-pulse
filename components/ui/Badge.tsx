import type { HTMLAttributes } from 'react';
import type { MonitorStatus } from '@/types';

type BadgeTone = 'up' | 'down' | 'neutral';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

interface StatusBadgeProps extends Omit<BadgeProps, 'tone'> {
  status?: MonitorStatus;
}

const TONE_STYLES: Record<BadgeTone, string> = {
  up: 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/70',
  down: 'bg-red-950/50 text-red-300 border border-red-800/70',
  neutral: 'bg-gray-800 text-gray-300 border border-gray-700',
};

function joinClasses(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export default function Badge({ tone = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={joinClasses(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium',
        TONE_STYLES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  if (status === 'UP') {
    return (
      <Badge tone="up" className={className} {...props}>
        UP
      </Badge>
    );
  }

  if (status === 'DOWN') {
    return (
      <Badge tone="down" className={className} {...props}>
        DOWN
      </Badge>
    );
  }

  return (
    <Badge tone="neutral" className={className} {...props}>
      Pending
    </Badge>
  );
}
