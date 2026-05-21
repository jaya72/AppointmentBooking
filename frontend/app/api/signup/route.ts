import { NextRequest, NextResponse } from 'next/server'
import { users } from '@/lib/demo-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    if (role !== 'patient' && role !== 'doctor') {
      return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 })
    }

    if (users.has(email)) {
      return NextResponse.json({ success: false, error: 'User already exists with this email' }, { status: 409 })
    }

    const id = `user-${Date.now()}`
    users.set(email, { id, name, email, password, role })

    return NextResponse.json({ success: true, message: 'Signup successful' }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}
