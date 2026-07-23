'use client'

import { Plus, Trash2 } from 'lucide-react'
import { FormField } from '@/components/auth/AuthShell'
import type {
  ApiAssertion,
  ApiAssertionType,
  ApiConfig,
  ApiHttpMethod,
  HeartbeatConfig,
  KeywordConfig,
  KeywordMatchMode,
  MonitorType,
  PingConfig,
  TcpConfig,
} from '@/types'

// ─── Options ──────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: MonitorType; label: string }[] = [
  { value: 'HTTP', label: 'HTTP(S)' },
  { value: 'KEYWORD', label: 'Keyword' },
  { value: 'TCP', label: 'TCP Port' },
  { value: 'PING', label: 'Ping' },
  { value: 'HEARTBEAT', label: 'Heartbeat' },
  { value: 'API', label: 'API' },
]

const KEYWORD_MODE_OPTIONS: { value: KeywordMatchMode; label: string }[] = [
  { value: 'MUST_CONTAIN', label: 'Must contain' },
  { value: 'MUST_NOT_CONTAIN', label: 'Must not contain' },
]

const API_METHOD_OPTIONS: ApiHttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD']

const ASSERTION_TYPE_OPTIONS: { value: ApiAssertionType; label: string }[] = [
  { value: 'STATUS_CODE', label: 'Status code equals' },
  { value: 'RESPONSE_TIME', label: 'Response time under' },
  { value: 'JSON_BODY', label: 'JSON body path equals' },
  { value: 'HEADER', label: 'Header equals' },
]

function defaultAssertion(type: ApiAssertionType): ApiAssertion {
  switch (type) {
    case 'STATUS_CODE':
      return { type, expectedStatusCode: 200 }
    case 'RESPONSE_TIME':
      return { type, maxResponseTimeMs: 2000 }
    case 'JSON_BODY':
      return { type, jsonPath: '', expectedValue: '' }
    case 'HEADER':
      return { type, headerName: '', expectedValue: '' }
  }
}

// ─── Pill selector (shared visual style) ─────────────────────────────────────

function PillGroup<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={[
            'rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-150',
            value === opt.value
              ? 'border-pulse-blue/40 bg-pulse-blue/15 text-pulse-blue'
              : 'border-white/[0.08] bg-white/[0.03] text-slate-500 hover:bg-white/[0.07] hover:text-slate-300',
            disabled ? 'cursor-not-allowed opacity-50' : '',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
      {children}
    </p>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface MonitorTypeFieldsProps {
  idPrefix: string
  type: MonitorType
  /** Omit to lock the type selector (editing an existing monitor — type is immutable). */
  onTypeChange?: (type: MonitorType) => void
  url: string
  onUrlChange: (url: string) => void
  keywordConfig: KeywordConfig
  onKeywordConfigChange: (config: KeywordConfig) => void
  tcpConfig: TcpConfig
  onTcpConfigChange: (config: TcpConfig) => void
  pingConfig: PingConfig
  onPingConfigChange: (config: PingConfig) => void
  heartbeatConfig: HeartbeatConfig
  onHeartbeatConfigChange: (config: HeartbeatConfig) => void
  apiConfig: ApiConfig
  onApiConfigChange: (config: ApiConfig) => void
}

export function MonitorTypeFields({
  idPrefix,
  type,
  onTypeChange,
  url,
  onUrlChange,
  keywordConfig,
  onKeywordConfigChange,
  tcpConfig,
  onTcpConfigChange,
  pingConfig,
  onPingConfigChange,
  heartbeatConfig,
  onHeartbeatConfigChange,
  apiConfig,
  onApiConfigChange,
}: MonitorTypeFieldsProps) {
  const urlBased = type === 'HTTP' || type === 'KEYWORD' || type === 'API'

  function updateAssertion(index: number, patch: Partial<ApiAssertion>) {
    const assertions = apiConfig.assertions.map((a, i) => (i === index ? { ...a, ...patch } : a))
    onApiConfigChange({ ...apiConfig, assertions })
  }

  function addAssertion() {
    onApiConfigChange({ ...apiConfig, assertions: [...apiConfig.assertions, defaultAssertion('STATUS_CODE')] })
  }

  function removeAssertion(index: number) {
    onApiConfigChange({ ...apiConfig, assertions: apiConfig.assertions.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <FieldLabel>Monitor type</FieldLabel>
        <PillGroup
          options={TYPE_OPTIONS}
          value={type}
          onChange={(t) => onTypeChange?.(t)}
          disabled={!onTypeChange}
        />
        {!onTypeChange && (
          <p className="text-xs text-slate-600">
            Type can&apos;t be changed after creation — delete and recreate the monitor instead.
          </p>
        )}
      </div>

      {urlBased && (
        <FormField
          label="URL"
          id={`${idPrefix}-url`}
          type="url"
          required
          autoComplete="off"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="example.com or https://api.example.com/health"
        />
      )}

      {type === 'KEYWORD' && (
        <>
          <FormField
            label="Keyword"
            id={`${idPrefix}-keyword`}
            type="text"
            required
            autoComplete="off"
            value={keywordConfig.keyword}
            onChange={(e) => onKeywordConfigChange({ ...keywordConfig, keyword: e.target.value })}
            placeholder="ok"
          />
          <div className="space-y-1.5">
            <FieldLabel>Match mode</FieldLabel>
            <PillGroup
              options={KEYWORD_MODE_OPTIONS}
              value={keywordConfig.mode}
              onChange={(mode) => onKeywordConfigChange({ ...keywordConfig, mode })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={keywordConfig.caseSensitive ?? false}
              onChange={(e) =>
                onKeywordConfigChange({ ...keywordConfig, caseSensitive: e.target.checked })
              }
              className="h-4 w-4 rounded border-white/20 bg-white/[0.03]"
            />
            Case-sensitive
          </label>
        </>
      )}

      {type === 'TCP' && (
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Host"
            id={`${idPrefix}-tcp-host`}
            type="text"
            required
            autoComplete="off"
            value={tcpConfig.host}
            onChange={(e) => onTcpConfigChange({ ...tcpConfig, host: e.target.value })}
            placeholder="db.example.com"
          />
          <FormField
            label="Port"
            id={`${idPrefix}-tcp-port`}
            type="number"
            required
            autoComplete="off"
            value={String(tcpConfig.port)}
            onChange={(e) => onTcpConfigChange({ ...tcpConfig, port: Number(e.target.value) })}
            placeholder="5432"
          />
        </div>
      )}

      {type === 'PING' && (
        <FormField
          label="Host"
          id={`${idPrefix}-ping-host`}
          type="text"
          required
          autoComplete="off"
          value={pingConfig.host}
          onChange={(e) => onPingConfigChange({ ...pingConfig, host: e.target.value })}
          placeholder="router.example.com"
        />
      )}

      {type === 'HEARTBEAT' && (
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Expected every (seconds)"
            id={`${idPrefix}-hb-period`}
            type="number"
            required
            autoComplete="off"
            value={String(heartbeatConfig.periodSeconds)}
            onChange={(e) =>
              onHeartbeatConfigChange({ ...heartbeatConfig, periodSeconds: Number(e.target.value) })
            }
            placeholder="3600"
          />
          <FormField
            label="Grace period (seconds)"
            id={`${idPrefix}-hb-grace`}
            type="number"
            required
            autoComplete="off"
            value={String(heartbeatConfig.graceSeconds)}
            onChange={(e) =>
              onHeartbeatConfigChange({ ...heartbeatConfig, graceSeconds: Number(e.target.value) })
            }
            placeholder="300"
          />
        </div>
      )}

      {type === 'API' && (
        <>
          <div className="space-y-1.5">
            <FieldLabel>Method</FieldLabel>
            <PillGroup
              options={API_METHOD_OPTIONS.map((m) => ({ value: m, label: m }))}
              value={apiConfig.method}
              onChange={(method) => onApiConfigChange({ ...apiConfig, method })}
            />
          </div>

          {apiConfig.method !== 'GET' && apiConfig.method !== 'HEAD' && (
            <FormField
              label="Request body (optional)"
              id={`${idPrefix}-api-body`}
              type="text"
              autoComplete="off"
              value={apiConfig.body ?? ''}
              onChange={(e) => onApiConfigChange({ ...apiConfig, body: e.target.value })}
              placeholder='{"key":"value"}'
            />
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FieldLabel>Assertions</FieldLabel>
              <button
                type="button"
                onClick={addAssertion}
                className="flex items-center gap-1 text-xs font-medium text-pulse-blue hover:text-pulse-blue/80"
              >
                <Plus size={13} /> Add
              </button>
            </div>

            {apiConfig.assertions.length === 0 && (
              <p className="text-xs text-slate-600">
                Add at least one assertion — e.g. status code equals 200.
              </p>
            )}

            <div className="space-y-2">
              {apiConfig.assertions.map((assertion, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] p-2.5"
                >
                  <select
                    value={assertion.type}
                    onChange={(e) => {
                      const nextType = e.target.value as ApiAssertionType
                      updateAssertion(index, defaultAssertion(nextType))
                    }}
                    className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-300"
                  >
                    {ASSERTION_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-slate-900">
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {assertion.type === 'STATUS_CODE' && (
                    <input
                      type="number"
                      value={assertion.expectedStatusCode ?? ''}
                      onChange={(e) =>
                        updateAssertion(index, { expectedStatusCode: Number(e.target.value) })
                      }
                      placeholder="200"
                      className="w-20 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-300"
                    />
                  )}

                  {assertion.type === 'RESPONSE_TIME' && (
                    <input
                      type="number"
                      value={assertion.maxResponseTimeMs ?? ''}
                      onChange={(e) =>
                        updateAssertion(index, { maxResponseTimeMs: Number(e.target.value) })
                      }
                      placeholder="2000 ms"
                      className="w-24 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-300"
                    />
                  )}

                  {assertion.type === 'JSON_BODY' && (
                    <>
                      <input
                        type="text"
                        value={assertion.jsonPath ?? ''}
                        onChange={(e) => updateAssertion(index, { jsonPath: e.target.value })}
                        placeholder="data.status"
                        className="w-32 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-300"
                      />
                      <span className="text-xs text-slate-600">=</span>
                      <input
                        type="text"
                        value={assertion.expectedValue ?? ''}
                        onChange={(e) => updateAssertion(index, { expectedValue: e.target.value })}
                        placeholder="ok"
                        className="w-24 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-300"
                      />
                    </>
                  )}

                  {assertion.type === 'HEADER' && (
                    <>
                      <input
                        type="text"
                        value={assertion.headerName ?? ''}
                        onChange={(e) => updateAssertion(index, { headerName: e.target.value })}
                        placeholder="x-env"
                        className="w-28 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-300"
                      />
                      <span className="text-xs text-slate-600">=</span>
                      <input
                        type="text"
                        value={assertion.expectedValue ?? ''}
                        onChange={(e) => updateAssertion(index, { expectedValue: e.target.value })}
                        placeholder="prod"
                        className="w-24 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-300"
                      />
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => removeAssertion(index)}
                    aria-label="Remove assertion"
                    className="ml-auto text-slate-600 hover:text-pulse-red"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Default config factories (used by New/Edit modals to seed state) ───────

export function defaultKeywordConfig(): KeywordConfig {
  return { keyword: '', mode: 'MUST_CONTAIN', caseSensitive: false }
}
export function defaultTcpConfig(): TcpConfig {
  return { host: '', port: 443 }
}
export function defaultPingConfig(): PingConfig {
  return { host: '' }
}
export function defaultHeartbeatConfig(): HeartbeatConfig {
  return { periodSeconds: 3600, graceSeconds: 300 }
}
export function defaultApiConfig(): ApiConfig {
  return { method: 'GET', assertions: [defaultAssertion('STATUS_CODE')] }
}
