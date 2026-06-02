// Shared in-memory store for demo (data persists during dev server session)

export interface DemoUser {
  id: string
  name: string
  email: string
  password: string
  role: 'patient' | 'doctor'
}

export interface DemoAppointment {
  _id: string
  userId: string
  name: string
  age: number
  address: string
  date: string
  time: string
  paymentStatus: 'PAID' | 'PENDING'
  meetingLink: string
  createdAt: string
}

// User store
export const users: Map<string, DemoUser> = new Map()

// Seed demo users
users.set('doctor@example.com', {
  id: 'demo-doctor-001',
  name: 'Dr. Demo',
  email: 'doctor@example.com',
  password: 'password123',
  role: 'doctor'
})

users.set('patient@example.com', {
  id: 'demo-patient-001',
  name: 'Demo Patient',
  email: 'patient@example.com',
  password: 'password123',
  role: 'patient'
})

// Appointments store
export const appointments: DemoAppointment[] = []

// Seed a demo appointment
const today = new Date().toISOString().split('T')[0]
appointments.push({
  _id: 'appt-demo-001',
  userId: 'demo-patient-001',
  name: 'Demo Patient',
  age: 28,
  address: '123 Main Street, City',
  date: today,
  time: '10:00 AM',
  paymentStatus: 'PAID',
  meetingLink: 'https://meet.jit.si/doctor-appointment-demo-001',
  createdAt: new Date().toISOString()
})

// Token helpers
export function generateJWT(userId: string, role: string): string {
  const payload = { userId, role, exp: Date.now() + 24 * 60 * 60 * 1000 }
  return btoa(JSON.stringify(payload))
}

export function parseToken(authHeader: string | null): { userId: string; role: string } | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    const token = authHeader.split(' ')[1]
    const payload = JSON.parse(atob(token))
    if (payload.exp < Date.now()) return null
    return { userId: payload.userId, role: payload.role }
  } catch {
    return null
  }
}
