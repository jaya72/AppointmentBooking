import { NextRequest, NextResponse } from 'next/server'
import { appointments, parseToken } from '@/lib/demo-store'

export async function GET(request: NextRequest) {
  const auth = parseToken(request.headers.get('authorization'))
  
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Access token is expired or invalid' }, { status: 401 })
  }

  // Doctors see all appointments, patients see only their own
  const filtered = auth.role === 'doctor'
    ? appointments
    : appointments.filter(a => a.userId === auth.userId)

  return NextResponse.json(filtered, { status: 200 })
}

export async function POST(request: NextRequest) {
  const auth = parseToken(request.headers.get('authorization'))
  
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Access token is expired or invalid' }, { status: 401 })
  }

  if (auth.role !== 'patient') {
    return NextResponse.json({ success: false, error: 'Only patients can book appointments' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, age, address, date, time } = body

    if (!name || !age || !address || !date || !time) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const appointment = {
      _id: `appt-${Date.now()}`,
      userId: auth.userId,
      name,
      age: Number(age),
      address,
      date,
      time,
      paymentStatus: 'PAID' as const,
      meetingLink: `https://meet.jit.si/doctor-appointment-${Date.now()}`,
      createdAt: new Date().toISOString()
    }

    appointments.push(appointment)

    return NextResponse.json({
      success: true,
      message: 'Appointment Saved Successfully',
      appointment
    }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}
