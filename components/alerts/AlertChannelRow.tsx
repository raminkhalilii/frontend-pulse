'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Link2, Pencil, Trash2, Send, Zap, Lock, Check, X } from 'lucide-react'
import { WebhookDeliveryLogs } from './WebhookDeliveryLogs'
import { SlackIcon } from './SlackSetupGuide'
import { DiscordIcon } from './DiscordSetupGuide'
import type {
  AlertChannel,
  PlatformTestResult,
  SlackMetadata,
  DiscordMetadata,
  WebhookTestResult,
} from '@/types'

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

function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-slate-400">Delete?</span>
      <button type="button" onClick={onConfirm} aria-label="Confirm delete"
        className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-pulse-red transition-colors hover:bg-pulse-red/10">
        Yes
      </button>
      <button type="button" onClick={onCancel} aria-label="Cancel delete"
        className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200">
        No
      </button>
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <span
      className="block h-3.5 w-3.5 animate-spin rounded-full border border-slate-600 border-t-slate-300"
      aria-hidden="true"
    />
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

// ─── Platform test result badge (Slack / Discord) ────────────────────────────

function PlatformResultBadge({
  result,
  successLabel,
}: {
  result: PlatformTestResult
  successLabel: string
}) {
  if (result.success) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-pulse-green/20 bg-pulse-green/10 px-1.5 py-0.5 text-[10px] font-medium text-pulse-green">
        <Check size={9} aria-hidden="true" />
        {successLabel}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-pulse-red/20 bg-pulse-red/10 px-1.5 py-0.5 text-[10px] font-medium text-pulse-red">
      <X size={9} aria-hidden="true" />
      Failed — check URL
    </span>
  )
}

// ─── Shared action buttons (toggle + test + edit + delete) ───────────────────

interface ActionBarProps {
  channel: AlertChannel
  isToggling: boolean
  isTesting: boolean
  isConfirmingDelete: boolean
  testLabel: string
  testIcon: React.ReactNode
  onToggle: (channel: AlertChannel) => void
  onEdit: (channel: AlertChannel) => void
  onTest: (channel: AlertChannel) => void
  onDeleteRequest: (id: string) => void
  onDeleteConfirm: (id: string) => void
  onDeleteCancel: () => void
}

function ActionBar({
  channel, isToggling, isTesting, isConfirmingDelete,
  testLabel, testIcon,
  onToggle, onEdit, onTest, onDeleteRequest, onDeleteConfirm, onDeleteCancel,
}: ActionBarProps) {
  return (
    <div className="flex flex-none items-center gap-1">
      <Toggle
        checked={channel.enabled}
        onChange={() => onToggle(channel)}
        disabled={isToggling}
        label={channel.enabled ? 'Disable channel' : 'Enable channel'}
      />

      {/* Test */}
      <button
        type="button"
        onClick={() => onTest(channel)}
        disabled={isTesting}
        aria-label={testLabel}
        title={testLabel}
        className="ml-1 cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-300 disabled:pointer-events-none disabled:opacity-40"
      >
        {isTesting ? <Spinner /> : testIcon}
      </button>

      {/* Edit */}
      <button
        type="button"
        onClick={() => onEdit(channel)}
        aria-label={`Edit channel`}
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
          aria-label={`Delete channel`}
          className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-pulse-red/[0.08] hover:text-pulse-red"
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

// ─── Email channel row ────────────────────────────────────────────────────────

function EmailChannelRow(props: AlertChannelRowProps) {
  const { channel } = props
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03]">
        <Mail size={14} className="text-slate-400" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm font-medium text-white">{channel.value}</p>
        {channel.label && <p className="truncate text-xs text-slate-500">{channel.label}</p>}
      </div>

      <ActionBar {...props}
        testLabel={`Send test alert to ${channel.value}`}
        testIcon={<Send size={14} aria-hidden="true" />}
      />
    </div>
  )
}

// ─── Webhook channel row ──────────────────────────────────────────────────────

function WebhookChannelRow(props: AlertChannelRowProps) {
  const { channel, webhookTestResult } = props
  const displayUrl = channel.value.length > 50 ? channel.value.slice(0, 50) + '…' : channel.value

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03]">
          <Link2 size={14} className="text-slate-400" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate font-mono text-sm font-medium text-white" title={channel.value}>
              {displayUrl}
            </p>
            {channel.hasSecret && (
              <span className="inline-flex flex-none items-center gap-0.5 rounded-md border border-pulse-blue/20 bg-pulse-blue/10 px-1.5 py-0.5 text-[10px] font-medium text-pulse-blue">
                <Lock size={8} aria-hidden="true" />
                Signed
              </span>
            )}
          </div>
          {channel.label && <p className="truncate text-xs text-slate-500">{channel.label}</p>}
        </div>

        <ActionBar {...props}
          testLabel={`Test webhook ${channel.value}`}
          testIcon={<Zap size={14} aria-hidden="true" />}
        />
      </div>

      <AnimatePresence>
        {webhookTestResult && (
          <motion.div key="webhook-result"
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="mt-2 ml-11">
            <WebhookResultBadge result={webhookTestResult} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="ml-11">
        <WebhookDeliveryLogs channelId={channel.id} />
      </div>
    </>
  )
}

// ─── Slack channel row ────────────────────────────────────────────────────────

function SlackChannelRow(props: AlertChannelRowProps) {
  const { channel, platformTestResult } = props
  const meta = channel.platformMetadata as SlackMetadata | null | undefined
  const primaryText = meta?.workspaceName || (channel.value.length > 50 ? channel.value.slice(0, 50) + '…' : channel.value)

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03]">
          <SlackIcon size={16} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white" title={channel.value}>
            {primaryText}
          </p>
          {meta?.channelName
            ? <p className="truncate text-xs text-slate-500">{meta.channelName}</p>
            : channel.label
              ? <p className="truncate text-xs text-slate-500">{channel.label}</p>
              : null
          }
        </div>

        <ActionBar {...props}
          testLabel="Send test Slack message"
          testIcon={<Zap size={14} aria-hidden="true" />}
        />
      </div>

      <AnimatePresence>
        {platformTestResult && (
          <motion.div key="slack-result"
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="mt-2 ml-11">
            <PlatformResultBadge result={platformTestResult} successLabel="✓ Message sent to Slack" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Discord channel row ──────────────────────────────────────────────────────

function DiscordChannelRow(props: AlertChannelRowProps) {
  const { channel, platformTestResult } = props
  const meta = channel.platformMetadata as DiscordMetadata | null | undefined
  const primaryText = meta?.serverName || (channel.value.length > 50 ? channel.value.slice(0, 50) + '…' : channel.value)

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03]">
          <DiscordIcon size={16} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white" title={channel.value}>
            {primaryText}
          </p>
          {meta?.channelName
            ? <p className="truncate text-xs text-slate-500">{meta.channelName}</p>
            : channel.label
              ? <p className="truncate text-xs text-slate-500">{channel.label}</p>
              : null
          }
        </div>

        <ActionBar {...props}
          testLabel="Send test Discord embed"
          testIcon={<Zap size={14} aria-hidden="true" />}
        />
      </div>

      <AnimatePresence>
        {platformTestResult && (
          <motion.div key="discord-result"
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="mt-2 ml-11">
            <PlatformResultBadge result={platformTestResult} successLabel="✓ Embed sent to Discord" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export interface AlertChannelRowProps {
  channel: AlertChannel
  isToggling: boolean
  isTesting: boolean
  /** Webhook test result — only for WEBHOOK channels. */
  webhookTestResult: WebhookTestResult | null
  /** Platform test result — for SLACK and DISCORD channels. */
  platformTestResult: PlatformTestResult | null
  isConfirmingDelete: boolean
  onToggle: (channel: AlertChannel) => void
  onEdit: (channel: AlertChannel) => void
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
      {channel.type === 'EMAIL'   && <EmailChannelRow   {...props} />}
      {channel.type === 'WEBHOOK' && <WebhookChannelRow {...props} />}
      {channel.type === 'SLACK'   && <SlackChannelRow   {...props} />}
      {channel.type === 'DISCORD' && <DiscordChannelRow {...props} />}
    </motion.div>
  )
}
