'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Check, X, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'

type Role = 'patient' | 'doctor'

interface FieldState {
  value: string
  touched: boolean
  error: string
}

function useField(initialValue = '') {
  const [state, setState] = useState<FieldState>({ value: initialValue, touched: false, error: '' })
  const set = (value: string) => setState(s => ({ ...s, value, touched: true }))
  const setError = (error: string) => setState(s => ({ ...s, error }))
  const touch = () => setState(s => ({ ...s, touched: true }))
  return { ...state, set, setError, touch }
}

function ValidationIcon({ ok, touched }: { ok: boolean; touched: boolean }) {
  if (!touched) return null
  return ok
    ? <Check className="w-4 h-4 text-emerald-500 shrink-0" />
    : <X className="w-4 h-4 text-destructive shrink-0" />
}

export default function SignupPage() {
  const router = useRouter()
  const name = useField()
  const phone = useField()
  const password = useField()
  const [role, setRole] = useState<Role>('patient')
  const [showPw, setShowPw] = useState(false)
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const nameOk = name.value.trim().length >= 2
  const phoneOk = /^[0-9]{10}$/.test(phone.value)
  const pwOk = password.value.length >= 6

  const canSubmit = nameOk && phoneOk && pwOk && !loading

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    name.touch(); phone.touch(); password.touch()
    if (!canSubmit) return
    setLoading(true)
    setServerError('')
    try {
      console.log('[v0] Attempting signup with:', { name: name.value.trim(), phone: phone.value.trim(), role })
      await api.post('/signup', { name: name.value.trim(), phone: phone.value.trim(), password: password.value, role })
      console.log('[v0] Signup successful')
      router.push('/login?registered=1')
    } catch (err: unknown) {
      console.error('[v0] Signup error:', err)
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Signup failed. Please try again.'
      setServerError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground tracking-tight">Doctor Appointment Booking App</span>
        </div>

        <div className="clay-card p-8">
          <h1 className="text-2xl font-semibold text-foreground mb-1 text-balance">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-6">Join Doctor Appointment Booking App to manage your health appointments.</p>

          {/* Role selector tab container (Tactile clay track) */}
          <div className="clay-tabs-container flex mb-6">
            {(['patient', 'doctor'] as Role[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  role === r
                    ? 'clay-tab-item-active shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r === 'patient' ? 'Patient' : 'Doctor'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="font-medium text-foreground ml-1">Full Name</Label>
              <div className="relative flex items-center">
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={name.value}
                  onChange={e => name.set(e.target.value)}
                  onBlur={name.touch}
                  className={`pr-9 clay-input ${name.touched && !nameOk ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                <span className="absolute right-3"><ValidationIcon ok={nameOk} touched={name.touched} /></span>
              </div>
              {name.touched && !nameOk && <p className="text-xs text-destructive ml-1">Name must be at least 2 characters.</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="font-medium text-foreground ml-1">Phone Number</Label>
              <div className="relative flex items-center">
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder=" "
                  value={phone.value}
                  onChange={e => phone.set(e.target.value.replace(/[^0-9]/g, ''))}
                  onBlur={phone.touch}
                  maxLength={10}
                  className={`pr-9 clay-input ${phone.touched && !phoneOk ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                <span className="absolute right-3"><ValidationIcon ok={phoneOk} touched={phone.touched} /></span>
              </div>
              {phone.touched && !phoneOk && <p className="text-xs text-destructive ml-1">Please enter a valid 10-digit phone number.</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-medium text-foreground ml-1">Password</Label>
              <div className="relative flex items-center">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder=" "
                  value={password.value}
                  onChange={e => password.set(e.target.value)}
                  onBlur={password.touch}
                  className={`pr-16 clay-input ${password.touched && !pwOk ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                <span className="absolute right-8"><ValidationIcon ok={pwOk} touched={password.touched} /></span>
                <button type="button" className="absolute right-3 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.touched && !pwOk && <p className="text-xs text-destructive ml-1">Password must be at least 6 characters.</p>}
            </div>

            {serverError && (
              <div className="clay-alert-error text-sm px-4 py-3">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full clay-btn mt-2" disabled={!canSubmit}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
