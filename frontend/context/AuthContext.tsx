'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User } from '@/lib/api'

interface AuthContextValue {
  user: User | null
  login: (user: User) => void
  logout: () => void
  isAuthenticated: boolean
  isDoctor: boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const token = localStorage.getItem('token')
      const role = localStorage.getItem('role') as 'patient' | 'doctor' | null
      const userId = localStorage.getItem('userId')
      const name = localStorage.getItem('name') || undefined
      const feeStr = localStorage.getItem('consultationFee')
      const consultationFee = feeStr ? parseInt(feeStr, 10) : undefined
      if (token && role && userId) {
        setUser({ token, role, userId, name, consultationFee })
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback((userData: User) => {
    localStorage.setItem('token', userData.token)
    localStorage.setItem('role', userData.role)
    localStorage.setItem('userId', userData.userId)
    if (userData.name) localStorage.setItem('name', userData.name)
    if (userData.consultationFee !== undefined) {
      localStorage.setItem('consultationFee', userData.consultationFee.toString())
    }
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('userId')
    localStorage.removeItem('name')
    localStorage.removeItem('consultationFee')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      isDoctor: user?.role === 'doctor',
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
