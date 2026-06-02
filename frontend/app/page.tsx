'use client'

import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#F3F4F6] flex items-center justify-center px-4">
      <div className="clay-card max-w-md w-full p-8 rounded-3xl text-center">

        <h1 className="text-4xl font-bold text-gray-800 mb-3">
          Doctor Appointment App
        </h1>

        <p className="text-gray-600 mb-8">
          AI-enabled telemedicine platform
        </p>

        <div className="space-y-4">

          <button
            onClick={() => router.push('/login')}
            className="clay-btn w-full py-3 rounded-2xl text-white font-semibold"
          >
            Patient Login
          </button>

          <button
            onClick={() => router.push('/signup')}
            className="clay-btn w-full py-3 rounded-2xl text-white font-semibold"
          >
            Patient Signup
          </button>

          <button
            onClick={() => router.push('/login')}
            className="clay-btn w-full py-3 rounded-2xl text-white font-semibold"
          >
            Doctor Login
          </button>

          <button
            onClick={() => router.push('/signup')}
            className="clay-btn w-full py-3 rounded-2xl text-white font-semibold"
          >
            Doctor Signup
          </button>

        </div>
      </div>
    </main>
  )
}