'use client';

import { motion } from 'framer-motion';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: [
    'relative overflow-hidden',
    'bg-gradient-to-r from-pulse-green to-emerald-400',
    'text-background font-semibold',
    'shadow-[0_0_0_0_rgba(16,185,129,0)]',
    'hover:shadow-[0_0_24px_rgba(16,185,129,0.45)]',
    'hover:from-emerald-400 hover:to-pulse-green',
    'transition-all duration-200',
    'before:absolute before:inset-0',
    'before:bg-gradient-to-r before:from-white/0 before:via-white/10 before:to-white/0',
    'before:translate-x-[-200%] hover:before:translate-x-[200%]',
    'before:transition-transform before:duration-500',
  ].join(' '),

  secondary: [
    'bg-surface border border-white/10',
    'text-slate-200',
    'hover:bg-white/5 hover:border-white/20',
    'transition-all duration-200',
  ].join(' '),

  outline: [
    'border border-pulse-blue/60',
    'text-pulse-blue',
    'hover:bg-pulse-blue/10 hover:border-pulse-blue',
    'hover:shadow-[0_0_16px_rgba(59,130,246,0.25)]',
    'transition-all duration-200',
  ].join(' '),

  ghost: [
    'bg-transparent text-slate-400',
    'hover:bg-white/5 hover:text-slate-200',
    'transition-all duration-200',
  ].join(' '),
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-lg gap-2',
  lg: 'px-7 py-3.5 text-base rounded-xl gap-2',
};

function Spinner() {
  return (
    <svg
      className="animate-spin w-4 h-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      whileTap={{ scale: isDisabled ? 1 : 0.96 }}
      className={[
        'inline-flex items-center justify-center font-semibold',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse-blue/60',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...(props as Record<string, unknown>)}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </motion.button>
  );
}
