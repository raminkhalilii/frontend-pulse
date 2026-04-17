'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Link2, Pencil, Trash2, Send, Zap, Lock, Check, X } from 'lucide-react'
import { WebhookDeliveryLogs } from './WebhookDeliveryLogs'
import type { AlertChannel, WebhookTestResult } from '@/types'

// ─── Shared toggle ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'flex cursor-pointer items-center gap-2 transition-opacity',
        disabled ? 'pointer-events-none opacity-50' : '',
      ].join(' ')}
    >
      <div
        className={[
          'relative h-5 w-9 rounded-full border transition-all duration-200',
          checked
            ? 'border-pulse-green/40 bg-pulse-green/20'
            : 'border-white/[0.08] bg-white/[0.05]',
        ].join(' ')}
        aria-hidden="true"
      >
        <div
          className={[
            'absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all duration-200',
            checked ? 'left-[18px] bg-pulse-green' : 'left-0.5 bg-slate-500',
          ].join(' ')}
        />
      </div>
    </button>
  )
}

// ─── Inline delete confirm ────────────────────────────────────────────────────

function DeleteConfirm({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-slate-400">Delete?</span>
      <button
        type="button"
        onClick={onConfirm}
        aria-label="Confirm delete"
        className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-pulse-red transition-colors hover:bg-pulse-red/10"
      >
        Yes
      </button>
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel delete"
        className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200"
      >
        No
      </button>
    </div>
  )
}

// ─── Webhook test result badge ────────────────────────────────────────────────

function WebhookResultBadge({ result }: { result: WebhookTestResult }) {
  if (result.success) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-pulse-green/20 bg-pulse-green/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-pulse-green">
        <Check size={9} aria-hidden="true" />
        {result.statusCode} · {result.responseTimeMs}ms
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-pulse-red/20 bg-pulse-red/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-pulse-red">
      <X size={9} aria-hidden="true" />
      {result.statusCode || 'Error'} · {result.responseTimeMs}ms
    </span>
  )
}

// ─── Email channel row ────────────────────────────────────────────────────────

function EmailChannelRow({
  channel,
  isToggling,
  isTesting,
  isConfirmingDelete,
  onToggle,
  onEdit,
  onTest,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: Omit<AlertChannelRowProps, 'webhookTestResult'>) {
  return (
    <>
      {/* Type icon */}
      <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03]">
        <Mail size={14} className="text-slate-400" aria-hidden="true" />
      </div>

      {/* Address + label */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm font-medium text-white">
          {channel.value}
        </p>
        {channel.label && (
          <p className="truncate text-xs text-slate-500">{channel.label}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-none items-center gap-1">
        <Toggle
          checked={channel.enabled}
          onChange={() => onToggle(channel)}
          disabled={isToggling}
          label={channel.enabled ? 'Disable channel' : 'Enable channel'}
        />

        {/* Send test email */}
        <button
          type="button"
          onClick={() => onTest(channel)}
          disabled={isTesting}
          aria-label={`Send test alert to ${channel.value}`}
          title="Send test alert"
          className="ml-1 cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-300 disabled:pointer-events-none disabled:opacity-40"
        >
          {isTesting ? (
            <span className="block h-3.5 w-3.5 animate-spin rounded-full border border-slate-600 border-t-slate-300" aria-hidden="true" />
          ) : (
            <Send size={14} aria-hidden="true" />
          )}
        </button>

        {/* Edit */}
        <button
          type="button"
          onClick={() => onEdit(channel)}
          aria-label={`Edit channel ${channel.value}`}
          className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-300"
        >
          <Pencil size={14} aria-hidden="true" />
        </button>

        {/* Delete */}
        {isConfirmingDelete ? (
          <DeleteConfirm
            onConfirm={() => onDeleteConfirm(channel.id)}
            onCancel={onDeleteCancel}
          />
        ) : (
          <button
            type="button"
            onClick={() => onDeleteRequest(channel.id)}
            aria-label={`Delete channel ${channel.value}`}
            className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-pulse-red/[0.08] hover:text-pulse-red"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        )}
      </div>
    </>
  )
}

// ─── Webhook channel row ──────────────────────────────────────────────────────

function WebhookChannelRow({
  channel,
  isToggling,
  isTesting,
  webhookTestResult,
  isConfirmingDelete,
  onToggle,
  onEdit,
  onTest,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: AlertChannelRowProps) {
  // Truncate URL for display, show full URL in title tooltip
  const displayUrl = channel.value.length > 50
    ? channel.value.slice(0, 50) + '…'
    : channel.value

  return (
    <>
      {/* Main row: icon + info + actions */}
      <div className="flex items-center gap-3">
        {/* Type icon */}
        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03]">
          <Link2 size={14} className="text-slate-400" aria-hidden="true" />
        </div>

        {/* URL + label + signed badge */}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p
              className="truncate font-mono text-sm font-medium text-white"
              title={channel.value}
            >
              {displayUrl}
            </p>
            {/* Signed badge — shown when a signing secret is configured */}
            {channel.hasSecret && (
              <span className="inline-flex flex-none items-center gap-0.5 rounded-md border border-pulse-blue/20 bg-pulse-blue/10 px-1.5 py-0.5 text-[10px] font-medium text-pulse-blue">
                <Lock size={8} aria-hidden="true" />
                Signed
              </span>
            )}
          </div>
          {channel.label && (
            <p className="truncate text-xs text-slate-500">{channel.label}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-none items-center gap-1">
          <Toggle
            checked={channel.enabled}
            onChange={() => onToggle(channel)}
            disabled={isToggling}
            label={channel.enabled ? 'Disable channel' : 'Enable channel'}
          />

          {/* Test webhook */}
          <button
            type="button"
            onClick={() => onTest(channel)}
            disabled={isTesting}
            aria-label={`Test webhook ${channel.value}`}
            title="Test webhook"
            className="ml-1 cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-300 disabled:pointer-events-none disabled:opacity-40"
          >
            {isTesting ? (
              <span className="block h-3.5 w-3.5 animate-spin rounded-full border border-slate-600 border-t-slate-300" aria-hidden="true" />
            ) : (
              <Zap size={14} aria-hidden="true" />
            )}
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={() => onEdit(channel)}
            aria-label={`Edit channel ${channel.value}`}
            className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-300"
          >
            <Pencil size={14} aria-hidden="true" />
          </button>

          {/* Delete */}
          {isConfirmingDelete ? (
            <DeleteConfirm
              onConfirm={() => onDeleteConfirm(channel.id)}
              onCancel={onDeleteCancel}
            />
          ) : (
            <button
              type="button"
              onClick={() => onDeleteRequest(channel.id)}
              aria-label={`Delete channel ${channel.value}`}
              className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-pulse-red/[0.08] hover:text-pulse-red"
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Test result badge (auto-dismissed by page after 8 s) */}
      <AnimatePresence>
        {webhookTestResult && (
          <motion.div
            key="webhook-result"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-2 ml-11"
          >
            <WebhookResultBadge result={webhookTestResult} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delivery logs expandable */}
      <div className="ml-11">
        <WebhookDeliveryLogs channelId={channel.id} />
      </div>
    </>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export interface AlertChannelRowProps {
  channel: AlertChannel
  isToggling: boolean
  isTesting: boolean
  /** Webhook test result to display inline (null = not tested or dismissed). */
  webhookTestResult: WebhookTestResult | null
  isConfirmingDelete: boolean
  onToggle: (channel: AlertChannel) => void
  onEdit: (channel: AlertChannel) => void
  /** Unified handler — page dispatches to email or webhook test based on channel.type. */
  onTest: (channel: AlertChannel) => void
  onDeleteRequest: (id: string) => void
  onDeleteConfirm: (id: string) => void
  onDeleteCancel: () => void
}

export function AlertChannelRow(props: AlertChannelRowProps) {
  const { channel } = props

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="border-t border-white/[0.06] py-4 first:border-t-0"
    >
      {channel.type === 'WEBHOOK' ? (
        <WebhookChannelRow {...props} />
      ) : (
        /* EMAIL (and future SLACK/DISCORD) fall back to the email variant */
        <div className="flex items-center gap-3">
          <EmailChannelRow {...props} />
        </div>
      )}
    </motion.div>
  )
}
