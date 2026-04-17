'use client'

import { useState, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Eye, EyeOff, Info } from 'lucide-react'
import Button from '@/components/ui/Button'
import { FormField } from '@/components/auth/AuthShell'
import { createAlertChannel } from '@/lib/api'
import type { AlertChannel, AlertChannelType } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function isValidHttpsUrl(v: string) {
  try {
    const u = new URL(v)
    return u.protocol === 'https:'
  } catch {
    return false
  }
}

// ─── Tooltip on the info icon beside "Webhook URL" label ─────────────────────
// Uses CSS group-hover — no new library, no custom component, purely Tailwind.

const WEBHOOK_DOCS_PAYLOAD = `{
  "event": "monitor.down",
  "monitor": { "id", "name", "url" },
  "alert": {
    "type", "triggeredAt", "errorMessage"
  }
}`

function WebhookInfoTooltip() {
  return (
    <div className="group relative inline-flex items-center">
      <Info
        size={11}
        className="cursor-help text-slate-600 transition-colors group-hover:text-slate-400"
        aria-hidden="true"
      />
      {/* Tooltip panel — appears on hover above the icon */}
      <div
        className={[
          'pointer-events-none absolute bottom-full left-0 z-20 mb-2 w-72',
          'opacity-0 transition-opacity duration-150 group-hover:opacity-100',
        ].join(' ')}
      >
        <div className="rounded-lg border border-white/[0.08] bg-[#0d1421] p-3 shadow-xl">
          <p className="mb-2 text-[11px] leading-relaxed text-slate-300">
            Pulse will <span className="font-semibold">POST</span> a signed JSON payload to this
            URL on every DOWN and RECOVERY alert.
          </p>
          <pre className="overflow-x-auto rounded bg-white/[0.04] p-2 font-mono text-[10px] leading-relaxed text-slate-500">
            {WEBHOOK_DOCS_PAYLOAD}
          </pre>
          <p className="mt-2 text-[11px] text-slate-500">
            Verify authenticity using the{' '}
            <code className="rounded bg-white/[0.05] px-1 text-slate-300">
              X-Pulse-Signature
            </code>{' '}
            header.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Email sub-form ───────────────────────────────────────────────────────────

interface EmailFormProps {
  onCreated: (channel: AlertChannel) => void
  onToast: (message: string, type?: 'success' | 'error') => void
}

function EmailForm({ onCreated, onToast }: EmailFormProps) {
  const [email,      setEmail]      = useState('')
  const [label,      setLabel]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [emailError, setEmailError] = useState('')
  const [formError,  setFormError]  = useState('')

  function validateEmail(value: string) {
    if (!value.trim()) return 'Email address is required'
    if (!isValidEmail(value.trim())) return 'Enter a valid email address'
    return ''
  }

  function handleBlur() {
    setEmailError(validateEmail(email))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const err = validateEmail(email)
    if (err) { setEmailError(err); return }

    setFormError('')
    setLoading(true)
    try {
      const created = await createAlertChannel({
        type: 'EMAIL',
        value: email.trim(),
        label: label.trim() || undefined,
      })
      onCreated(created)
      onToast('Email channel added')
      setEmail('')
      setLabel('')
      setEmailError('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add channel.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField
        label="Email Address"
        id="add-channel-email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError('') }}
        onBlur={handleBlur}
        placeholder="you@example.com"
        error={emailError}
      />

      <div className="space-y-1.5">
        <label
          htmlFor="add-email-label"
          className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500"
        >
          Label
        </label>
        <input
          id="add-email-label"
          type="text"
          autoComplete="off"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Work email, On-call phone"
          className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-700 transition-all duration-200 focus:border-pulse-blue/50 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] focus:outline-none"
        />
        <p className="text-[11px] text-slate-600">
          Optional. Helps you identify this channel.
        </p>
      </div>

      <AnimatePresence>
        {formError && (
          <motion.p
            key="email-form-error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-pulse-red/20 bg-pulse-red/[0.06] px-4 py-2.5 text-sm text-pulse-red"
          >
            {formError}
          </motion.p>
        )}
      </AnimatePresence>

      <Button
        type="submit"
        variant="primary"
        size="md"
        isLoading={loading}
        leftIcon={!loading ? <Plus size={15} /> : undefined}
      >
        Add Channel
      </Button>
    </form>
  )
}

// ─── Webhook sub-form ─────────────────────────────────────────────────────────

interface WebhookFormProps {
  onCreated: (channel: AlertChannel) => void
  onToast: (message: string, type?: 'success' | 'error') => void
}

function WebhookForm({ onCreated, onToast }: WebhookFormProps) {
  const [webhookUrl,    setWebhookUrl]    = useState('')
  const [secret,        setSecret]        = useState('')
  const [label,         setLabel]         = useState('')
  const [showSecret,    setShowSecret]    = useState(false)
  const [urlError,      setUrlError]      = useState('')
  const [formError,     setFormError]     = useState('')
  const [loading,       setLoading]       = useState(false)

  function validateUrl(value: string) {
    if (!value.trim()) return 'Webhook URL is required'
    if (!isValidHttpsUrl(value.trim())) return 'Webhook URL must use HTTPS'
    return ''
  }

  function handleUrlBlur() {
    setUrlError(validateUrl(webhookUrl))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const err = validateUrl(webhookUrl)
    if (err) { setUrlError(err); return }

    setFormError('')
    setLoading(true)
    try {
      const created = await createAlertChannel({
        type: 'WEBHOOK',
        value: webhookUrl.trim(),
        label: label.trim() || undefined,
        secret: secret.trim() || undefined,
      })
      onCreated(created)
      onToast('Webhook channel added')
      setWebhookUrl('')
      setSecret('')
      setLabel('')
      setUrlError('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add channel.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>

      {/* ── Webhook URL ── */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <label
            htmlFor="add-webhook-url"
            className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500"
          >
            Webhook URL
          </label>
          <WebhookInfoTooltip />
        </div>
        <input
          id="add-webhook-url"
          type="url"
          autoComplete="off"
          required
          value={webhookUrl}
          onChange={(e) => {
            setWebhookUrl(e.target.value)
            if (urlError) setUrlError('')
          }}
          onBlur={handleUrlBlur}
          placeholder="https://your-server.com/webhook"
          className={[
            'w-full rounded-lg border bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-700',
            'transition-all duration-200 focus:outline-none focus:bg-white/[0.07]',
            urlError
              ? 'border-pulse-red/40 focus:border-pulse-red/60 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.10)]'
              : 'border-white/[0.08] focus:border-pulse-blue/50 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
          ].join(' ')}
        />
        {urlError && (
          <p className="text-[11px] text-pulse-red">{urlError}</p>
        )}
      </div>

      {/* ── Signing Secret ── */}
      <div className="space-y-1.5">
        <label
          htmlFor="add-webhook-secret"
          className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500"
        >
          Signing Secret
        </label>
        <div className="relative">
          <input
            id="add-webhook-secret"
            type={showSecret ? 'text' : 'password'}
            autoComplete="new-password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Leave blank to skip request signing"
            className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-700 transition-all duration-200 focus:border-pulse-blue/50 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowSecret((s) => !s)}
            aria-label={showSecret ? 'Hide secret' : 'Show secret'}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 transition-colors hover:text-slate-300"
          >
            {showSecret ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
          </button>
        </div>
        <p className="text-[11px] text-slate-600">
          If set, Pulse will sign every request with HMAC-SHA256. Verify the{' '}
          <code className="rounded bg-white/[0.05] px-1 text-slate-500">X-Pulse-Signature</code>{' '}
          header in your server.
        </p>
      </div>

      {/* ── Label ── */}
      <div className="space-y-1.5">
        <label
          htmlFor="add-webhook-label"
          className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500"
        >
          Label
        </label>
        <input
          id="add-webhook-label"
          type="text"
          autoComplete="off"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Production alerts, PagerDuty"
          className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-700 transition-all duration-200 focus:border-pulse-blue/50 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] focus:outline-none"
        />
        <p className="text-[11px] text-slate-600">
          Optional. Helps you identify this channel.
        </p>
      </div>

      {/* ── Form-level error ── */}
      <AnimatePresence>
        {formError && (
          <motion.p
            key="webhook-form-error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-pulse-red/20 bg-pulse-red/[0.06] px-4 py-2.5 text-sm text-pulse-red"
          >
            {formError}
          </motion.p>
        )}
      </AnimatePresence>

      <Button
        type="submit"
        variant="primary"
        size="md"
        isLoading={loading}
        leftIcon={!loading ? <Plus size={15} /> : undefined}
      >
        Add Webhook
      </Button>
    </form>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

// Only EMAIL and WEBHOOK are supported in Phase 3
type SupportedChannelType = Extract<AlertChannelType, 'EMAIL' | 'WEBHOOK'>

const TYPE_OPTIONS: { value: SupportedChannelType; label: string }[] = [
  { value: 'EMAIL',   label: 'Email'   },
  { value: 'WEBHOOK', label: 'Webhook' },
]

export interface AddAlertChannelFormProps {
  onCreated: (channel: AlertChannel) => void
  onToast: (message: string, type?: 'success' | 'error') => void
}

export function AddAlertChannelForm({ onCreated, onToast }: AddAlertChannelFormProps) {
  const [channelType, setChannelType] = useState<SupportedChannelType>('EMAIL')

  function handleTypeChange(next: SupportedChannelType) {
    // Switching resets the sub-form state naturally (new component instance
    // is mounted when the type changes and AnimatePresence re-mounts it)
    setChannelType(next)
  }

  return (
    <div className="space-y-5">
      {/* ── Channel type segmented control ── */}
      {/* Reuses the exact same pill-button pattern as the frequency selector
          in NewMonitorModal — active: blue tint, inactive: ghost */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Channel Type
        </p>
        <div className="flex gap-2">
          {TYPE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleTypeChange(value)}
              className={[
                'flex-1 rounded-lg border py-2 text-xs font-medium transition-all duration-200',
                channelType === value
                  ? 'border-pulse-blue/40 bg-pulse-blue/15 text-pulse-blue'
                  : 'border-white/[0.08] bg-white/[0.03] text-slate-500 hover:bg-white/[0.07] hover:text-slate-300',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sub-form — re-mounts on type switch so state resets cleanly ── */}
      <AnimatePresence mode="wait" initial={false}>
        {channelType === 'EMAIL' ? (
          <motion.div
            key="email-form"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <EmailForm onCreated={onCreated} onToast={onToast} />
          </motion.div>
        ) : (
          <motion.div
            key="webhook-form"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <WebhookForm onCreated={onCreated} onToast={onToast} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
