'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const justRegistered = searchParams.get('registered') === '1'
  const { login } = useAuth()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isPhoneValid = /^[0-9]{10}$/.test(phone)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phone || !password) return
    setLoading(true)
    setError('')
    try {
      console.log('[v0] Attempting login with:', { phone: phone.trim() })
      const res = await api.post('/login', { phone: phone.trim(), password })
      console.log('[v0] Login response:', res.data)
      const data = res.data
      login({ token: data.token, role: data.role, userId: data.userId, name: data.name, consultationFee: data.consultationFee })
      if (data.role === 'doctor') router.push('/doctor')
      else router.push('/patient')
    } catch (err: unknown) {
      console.error('[v0] Login error:', err)
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground tracking-tight">MediBook</span>
        </div>

        <div className="clay-card p-8">
          <h1 className="text-2xl font-semibold text-foreground mb-1 text-balance">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-6">Sign in to your MediBook account.</p>

          {justRegistered && (
            <div className="clay-alert-success text-sm px-4 py-3 mb-4">
              Account created successfully! Sign in to continue.
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="font-medium text-foreground ml-1">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="9876543210"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                className="clay-input"
                maxLength={10}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-medium text-foreground ml-1">Password</Label>
              <div className="relative flex items-center">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pr-10 clay-input"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="clay-alert-error text-sm px-4 py-3">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full clay-btn mt-2" disabled={!isPhoneValid || loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-6">
            {"Don't have an account? "}
            <Link href="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
