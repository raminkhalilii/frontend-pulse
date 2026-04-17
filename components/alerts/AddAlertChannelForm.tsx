'use client'

import { useState, useEffect, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Eye, EyeOff, Info } from 'lucide-react'
import Button from '@/components/ui/Button'
import { FormField } from '@/components/auth/AuthShell'
import { createAlertChannel } from '@/lib/api'
import { SlackIcon, SlackSetupGuide } from './SlackSetupGuide'
import { DiscordIcon, DiscordSetupGuide } from './DiscordSetupGuide'
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

// ─── Shared input class builders ──────────────────────────────────────────────

function inputClass(hasError: boolean) {
  return [
    'w-full rounded-lg border bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-700',
    'transition-all duration-200 focus:outline-none focus:bg-white/[0.07]',
    hasError
      ? 'border-pulse-red/40 focus:border-pulse-red/60 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.10)]'
      : 'border-white/[0.08] focus:border-pulse-blue/50 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
  ].join(' ')
}

const LABEL_CLASS =
  'block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500'

const PLAIN_INPUT_CLASS =
  'w-full rounded-lg border border-white/[0.08] bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-700 transition-all duration-200 focus:border-pulse-blue/50 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] focus:outline-none'

// ─── Tooltip on the info icon beside "Webhook URL" label ─────────────────────

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

// ─── Shared form-level error ──────────────────────────────────────────────────

function FormError({ error, id }: { error: string; id: string }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.p
          key={id}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="rounded-lg border border-pulse-red/20 bg-pulse-red/[0.06] px-4 py-2.5 text-sm text-pulse-red"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  )
}

// ─── Email sub-form ───────────────────────────────────────────────────────────

function EmailForm({ onCreated, onToast }: SubFormProps) {
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const err = validateEmail(email)
    if (err) { setEmailError(err); return }

    setFormError('')
    setLoading(true)
    try {
      const created = await createAlertChannel({ type: 'EMAIL', value: email.trim(), label: label.trim() || undefined })
      onCreated(created)
      onToast('Email channel added')
      setEmail(''); setLabel(''); setEmailError('')
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
        onBlur={() => setEmailError(validateEmail(email))}
        placeholder="you@example.com"
        error={emailError}
      />

      <div className="space-y-1.5">
        <label htmlFor="add-email-label" className={LABEL_CLASS}>Label</label>
        <input
          id="add-email-label"
          type="text"
          autoComplete="off"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Work email, On-call phone"
          className={PLAIN_INPUT_CLASS}
        />
        <p className="text-[11px] text-slate-600">Optional. Helps you identify this channel.</p>
      </div>

      <FormError error={formError} id="email-form-error" />

      <Button type="submit" variant="primary" size="md" isLoading={loading}
        leftIcon={!loading ? <Plus size={15} /> : undefined}>
        Add Channel
      </Button>
    </form>
  )
}

// ─── Webhook sub-form ─────────────────────────────────────────────────────────

function WebhookForm({ onCreated, onToast }: SubFormProps) {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [secret,     setSecret]     = useState('')
  const [label,      setLabel]      = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [urlError,   setUrlError]   = useState('')
  const [formError,  setFormError]  = useState('')
  const [loading,    setLoading]    = useState(false)

  function validateUrl(v: string) {
    if (!v.trim()) return 'Webhook URL is required'
    if (!isValidHttpsUrl(v.trim())) return 'Webhook URL must use HTTPS'
    return ''
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const err = validateUrl(webhookUrl)
    if (err) { setUrlError(err); return }

    setFormError('')
    setLoading(true)
    try {
      const created = await createAlertChannel({
        type: 'WEBHOOK', value: webhookUrl.trim(),
        label: label.trim() || undefined,
        secret: secret.trim() || undefined,
      })
      onCreated(created)
      onToast('Webhook channel added')
      setWebhookUrl(''); setSecret(''); setLabel(''); setUrlError('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add channel.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Webhook URL */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <label htmlFor="add-webhook-url" className={LABEL_CLASS}>Webhook URL</label>
          <WebhookInfoTooltip />
        </div>
        <input
          id="add-webhook-url"
          type="url"
          autoComplete="off"
          required
          value={webhookUrl}
          onChange={(e) => { setWebhookUrl(e.target.value); if (urlError) setUrlError('') }}
          onBlur={() => setUrlError(validateUrl(webhookUrl))}
          placeholder="https://your-server.com/webhook"
          className={inputClass(!!urlError)}
        />
        {urlError && <p className="text-[11px] text-pulse-red">{urlError}</p>}
      </div>

      {/* Signing Secret */}
      <div className="space-y-1.5">
        <label htmlFor="add-webhook-secret" className={LABEL_CLASS}>Signing Secret</label>
        <div className="relative">
          <input
            id="add-webhook-secret"
            type={showSecret ? 'text' : 'password'}
            autoComplete="new-password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Leave blank to skip request signing"
            className={`${PLAIN_INPUT_CLASS} pr-10`}
          />
          <button type="button" onClick={() => setShowSecret((s) => !s)}
            aria-label={showSecret ? 'Hide secret' : 'Show secret'}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 transition-colors hover:text-slate-300">
            {showSecret ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
          </button>
        </div>
        <p className="text-[11px] text-slate-600">
          If set, Pulse signs every request with HMAC-SHA256. Verify the{' '}
          <code className="rounded bg-white/[0.05] px-1 text-slate-500">X-Pulse-Signature</code>{' '}
          header in your server.
        </p>
      </div>

      {/* Label */}
      <div className="space-y-1.5">
        <label htmlFor="add-webhook-label" className={LABEL_CLASS}>Label</label>
        <input id="add-webhook-label" type="text" autoComplete="off"
          value={label} onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Production alerts, PagerDuty"
          className={PLAIN_INPUT_CLASS} />
        <p className="text-[11px] text-slate-600">Optional. Helps you identify this channel.</p>
      </div>

      <FormError error={formError} id="webhook-form-error" />

      <Button type="submit" variant="primary" size="md" isLoading={loading}
        leftIcon={!loading ? <Plus size={15} /> : undefined}>
        Add Webhook
      </Button>
    </form>
  )
}

// ─── Slack sub-form ───────────────────────────────────────────────────────────

function SlackForm({ onCreated, onToast }: SubFormProps) {
  const [webhookUrl,     setWebhookUrl]     = useState('')
  const [workspaceName,  setWorkspaceName]  = useState('')
  const [channelName,    setChannelName]    = useState('')
  const [label,          setLabel]          = useState('')
  const [urlError,       setUrlError]       = useState('')
  const [formError,      setFormError]      = useState('')
  const [loading,        setLoading]        = useState(false)

  function validateUrl(v: string) {
    if (!v.trim()) return 'Slack Webhook URL is required'
    if (!v.trim().startsWith('https://hooks.slack.com/'))
      return 'Must be a valid Slack Incoming Webhook URL'
    return ''
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const err = validateUrl(webhookUrl)
    if (err) { setUrlError(err); return }

    setFormError('')
    setLoading(true)
    try {
      const created = await createAlertChannel({
        type: 'SLACK',
        value: webhookUrl.trim(),
        label: label.trim() || undefined,
        platformMetadata: {
          workspaceName: workspaceName.trim() || undefined,
          channelName: channelName.trim() || undefined,
        },
      })
      onCreated(created)
      onToast('Slack channel added')
      setWebhookUrl(''); setWorkspaceName(''); setChannelName(''); setLabel(''); setUrlError('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add channel.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Slack Webhook URL */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <label htmlFor="add-slack-url" className={LABEL_CLASS}>Slack Webhook URL</label>
          <SlackSetupGuide />
        </div>
        <input
          id="add-slack-url"
          type="url"
          autoComplete="off"
          required
          value={webhookUrl}
          onChange={(e) => { setWebhookUrl(e.target.value); if (urlError) setUrlError('') }}
          onBlur={() => setUrlError(validateUrl(webhookUrl))}
          placeholder="https://hooks.slack.com/services/T.../B.../..."
          className={inputClass(!!urlError)}
        />
        {urlError
          ? <p className="text-[11px] text-pulse-red">{urlError}</p>
          : (
            <p className="text-[11px] text-slate-600">
              Don&apos;t have one?{' '}
              <a
                href="https://api.slack.com/messaging/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 underline underline-offset-2 transition-colors hover:text-slate-200"
              >
                Create a Slack app → add Incoming Webhooks → copy the URL.
              </a>
            </p>
          )
        }
      </div>

      {/* Workspace Name */}
      <div className="space-y-1.5">
        <label htmlFor="add-slack-workspace" className={LABEL_CLASS}>Workspace Name</label>
        <input
          id="add-slack-workspace"
          type="text"
          autoComplete="off"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          placeholder="e.g. Acme Corp"
          className={PLAIN_INPUT_CLASS}
        />
      </div>

      {/* Channel Name */}
      <div className="space-y-1.5">
        <label htmlFor="add-slack-channel" className={LABEL_CLASS}>Channel</label>
        <input
          id="add-slack-channel"
          type="text"
          autoComplete="off"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          placeholder="e.g. #alerts"
          className={PLAIN_INPUT_CLASS}
        />
      </div>

      {/* Label */}
      <div className="space-y-1.5">
        <label htmlFor="add-slack-label" className={LABEL_CLASS}>Label</label>
        <input
          id="add-slack-label"
          type="text"
          autoComplete="off"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. #prod-alerts workspace"
          className={PLAIN_INPUT_CLASS}
        />
        <p className="text-[11px] text-slate-600">Optional. Helps you identify this channel.</p>
      </div>

      <FormError error={formError} id="slack-form-error" />

      <Button type="submit" variant="primary" size="md" isLoading={loading}
        leftIcon={!loading ? <Plus size={15} /> : undefined}>
        Add Slack Channel
      </Button>
    </form>
  )
}

// ─── Discord sub-form ─────────────────────────────────────────────────────────

function DiscordForm({ onCreated, onToast }: SubFormProps) {
  const [webhookUrl,  setWebhookUrl]  = useState('')
  const [serverName,  setServerName]  = useState('')
  const [channelName, setChannelName] = useState('')
  const [label,       setLabel]       = useState('')
  const [urlError,    setUrlError]    = useState('')
  const [formError,   setFormError]   = useState('')
  const [loading,     setLoading]     = useState(false)

  function validateUrl(v: string) {
    if (!v.trim()) return 'Discord Webhook URL is required'
    const trimmed = v.trim()
    if (
      !trimmed.startsWith('https://discord.com/api/webhooks/') &&
      !trimmed.startsWith('https://discordapp.com/api/webhooks/')
    ) {
      return 'Must be a valid Discord Webhook URL'
    }
    return ''
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const err = validateUrl(webhookUrl)
    if (err) { setUrlError(err); return }

    setFormError('')
    setLoading(true)
    try {
      const created = await createAlertChannel({
        type: 'DISCORD',
        value: webhookUrl.trim(),
        label: label.trim() || undefined,
        platformMetadata: {
          serverName: serverName.trim() || undefined,
          channelName: channelName.trim() || undefined,
        },
      })
      onCreated(created)
      onToast('Discord channel added')
      setWebhookUrl(''); setServerName(''); setChannelName(''); setLabel(''); setUrlError('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add channel.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Discord Webhook URL */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <label htmlFor="add-discord-url" className={LABEL_CLASS}>Discord Webhook URL</label>
          <DiscordSetupGuide />
        </div>
        <input
          id="add-discord-url"
          type="url"
          autoComplete="off"
          required
          value={webhookUrl}
          onChange={(e) => { setWebhookUrl(e.target.value); if (urlError) setUrlError('') }}
          onBlur={() => setUrlError(validateUrl(webhookUrl))}
          placeholder="https://discord.com/api/webhooks/..."
          className={inputClass(!!urlError)}
        />
        {urlError
          ? <p className="text-[11px] text-pulse-red">{urlError}</p>
          : (
            <p className="text-[11px] text-slate-600">
              Server Settings → Integrations → Webhooks → New Webhook → Copy URL.{' '}
              <a
                href="https://support.discord.com/hc/en-us/articles/228383668"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 underline underline-offset-2 transition-colors hover:text-slate-200"
              >
                Learn more →
              </a>
            </p>
          )
        }
      </div>

      {/* Server Name */}
      <div className="space-y-1.5">
        <label htmlFor="add-discord-server" className={LABEL_CLASS}>Server Name</label>
        <input
          id="add-discord-server"
          type="text"
          autoComplete="off"
          value={serverName}
          onChange={(e) => setServerName(e.target.value)}
          placeholder="e.g. My Dev Server"
          className={PLAIN_INPUT_CLASS}
        />
      </div>

      {/* Channel Name */}
      <div className="space-y-1.5">
        <label htmlFor="add-discord-channel" className={LABEL_CLASS}>Channel</label>
        <input
          id="add-discord-channel"
          type="text"
          autoComplete="off"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          placeholder="e.g. #uptime-alerts"
          className={PLAIN_INPUT_CLASS}
        />
      </div>

      {/* Label */}
      <div className="space-y-1.5">
        <label htmlFor="add-discord-label" className={LABEL_CLASS}>Label</label>
        <input
          id="add-discord-label"
          type="text"
          autoComplete="off"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Production Discord"
          className={PLAIN_INPUT_CLASS}
        />
        <p className="text-[11px] text-slate-600">Optional. Helps you identify this channel.</p>
      </div>

      <FormError error={formError} id="discord-form-error" />

      <Button type="submit" variant="primary" size="md" isLoading={loading}
        leftIcon={!loading ? <Plus size={15} /> : undefined}>
        Add Discord Channel
      </Button>
    </form>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

interface SubFormProps {
  onCreated: (channel: AlertChannel) => void
  onToast: (message: string, type?: 'success' | 'error') => void
}

const TYPE_OPTIONS: { value: AlertChannelType; label: string; icon: React.ReactNode }[] = [
  { value: 'EMAIL',   label: 'Email',   icon: null },
  { value: 'WEBHOOK', label: 'Webhook', icon: null },
  { value: 'SLACK',   label: 'Slack',   icon: <SlackIcon size={13} /> },
  { value: 'DISCORD', label: 'Discord', icon: <DiscordIcon size={13} /> },
]

export interface AddAlertChannelFormProps {
  onCreated: (channel: AlertChannel) => void
  onToast: (message: string, type?: 'success' | 'error') => void
  /** Pre-selects a channel type — used by the empty-state quick-add buttons. */
  externalType?: AlertChannelType
}

export function AddAlertChannelForm({ onCreated, onToast, externalType }: AddAlertChannelFormProps) {
  const [channelType, setChannelType] = useState<AlertChannelType>('EMAIL')

  // Sync when a parent pre-selects a type (e.g. empty-state quick-add buttons)
  useEffect(() => {
    if (externalType) setChannelType(externalType)
  }, [externalType])

  return (
    <div className="space-y-5">
      {/* ── Channel type segmented control ── */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Channel Type
        </p>
        <div className="grid grid-cols-4 gap-2">
          {TYPE_OPTIONS.map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setChannelType(value)}
              className={[
                'flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-all duration-200',
                channelType === value
                  ? 'border-pulse-blue/40 bg-pulse-blue/15 text-pulse-blue'
                  : 'border-white/[0.08] bg-white/[0.03] text-slate-500 hover:bg-white/[0.07] hover:text-slate-300',
              ].join(' ')}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sub-form — re-mounts on type switch so state resets cleanly ── */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={channelType}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {channelType === 'EMAIL'   && <EmailForm   onCreated={onCreated} onToast={onToast} />}
          {channelType === 'WEBHOOK' && <WebhookForm onCreated={onCreated} onToast={onToast} />}
          {channelType === 'SLACK'   && <SlackForm   onCreated={onCreated} onToast={onToast} />}
          {channelType === 'DISCORD' && <DiscordForm onCreated={onCreated} onToast={onToast} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
