import { NextRequest, NextResponse } from 'next/server'
import { users, generateJWT } from '@/lib/demo-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Missing email or password' }, { status: 400 })
    }

    const user = users.get(email)
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    if (user.password !== password) {
      return NextResponse.json({ success: false, error: 'Wrong password' }, { status: 401 })
    }

    const token = generateJWT(user.id, user.role)

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      userId: user.id,
      role: user.role
    }, { status: 200 })
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}
