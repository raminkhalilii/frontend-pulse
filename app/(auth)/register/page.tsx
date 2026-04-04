'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import { AuthShell, FormField } from '@/components/auth/AuthShell'
import { registerUser } from '@/lib/api'

interface FieldErrors {
  confirmPassword?: string
}

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match.' })
      return
    }

    setLoading(true)
    try {
      await registerUser(email, name, password)
      window.location.replace('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create an account"
      subtitle="Start monitoring your services in minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-pulse-blue hover:text-blue-400 font-medium transition-colors"
          >
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <FormField
          label="Display name"
          id="name"
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
        />

        <FormField
          label="Email address"
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <FormField
          label="Password"
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
        />

        <FormField
          label="Confirm password"
          id="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          error={fieldErrors.confirmPassword}
        />

        <AnimatePresence>
          {error && (
            <motion.p
              key="register-error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="text-pulse-red text-sm bg-pulse-red/[0.06] border border-pulse-red/20 rounded-lg px-4 py-2.5"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={loading}
          className="mt-1"
        >
          Create account
        </Button>
      </form>
    </AuthShell>
  )
}
