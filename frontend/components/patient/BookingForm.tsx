'use client'

import { useState } from 'react'
import { format, addDays, isBefore, startOfDay, parseISO, set as setDate } from 'date-fns'
import { CalendarDays, User, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api, { type BookPayload } from '@/lib/api'

const TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
]

function isSlotPast(dateStr: string, timeStr: string): boolean {
  try {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
    if (!match) return false
    let hours = parseInt(match[1])
    const minutes = parseInt(match[2])
    const ampm = match[3].toUpperCase()
    if (ampm === 'PM' && hours !== 12) hours += 12
    if (ampm === 'AM' && hours === 12) hours = 0
    const slotDate = setDate(parseISO(dateStr), { hours, minutes, seconds: 0 })
    return isBefore(slotDate, new Date())
  } catch {
    return false
  }
}

function generateDateOptions(): { label: string; value: string }[] {
  const today = startOfDay(new Date())
  return Array.from({ length: 14 }, (_, i) => {
    const d = addDays(today, i)
    return {
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(d, 'EEE, MMM d'),
      value: format(d, 'yyyy-MM-dd'),
    }
  })
}

interface Props {
  onBooked: () => void
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false)
    if ((window as any).Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function BookingForm({ onBooked }: Props) {
  const [step, setStep] = useState(1)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [patientName, setPatientName] = useState('')
  const [age, setAge] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const dates = generateDateOptions()

  const canStep1 = !!selectedDate && !!selectedTime
  const canStep2 = patientName.trim().length >= 2 && parseInt(age) > 0 && parseInt(age) < 130 && address.trim().length >= 5

  async function handleBook() {
    setLoading(true)
    setError('')
    try {
      // Step A: Create payment order on backend
      const orderRes = await api.post('/pay/order')
      const orderData = orderRes.data

      // Step B: If mock mode is active, book directly
      if (orderData.mock) {
        console.log('[v0] Mock checkout, bypassing payment popup')
        const payload = {
          name: patientName.trim(),
          age: parseInt(age),
          address: address.trim(),
          date: selectedDate,
          time: selectedTime,
        }
        await api.post('/book', payload)
        setStep(3)
        onBooked()
        return
      }

      // Step C: Load SDK and open popup for real transaction
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        setError('Razorpay SDK failed to load. Please check your internet connection.')
        setLoading(false)
        return
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: 'INR',
        name: 'MediBook Appointment',
        description: `Booking for ${patientName}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          setLoading(true)
          try {
            const payload = {
              name: patientName.trim(),
              age: parseInt(age),
              address: address.trim(),
              date: selectedDate,
              time: selectedTime,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }
            await api.post('/book', payload)
            setStep(3)
            onBooked()
          } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Payment verification failed.'
            setError(msg)
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: patientName,
        },
        theme: {
          color: '#aa3bff',
        },
        modal: {
          ondismiss: function () {
            setLoading(false)
          }
        }
      }

      const paymentObject = new (window as any).Razorpay(options)
      paymentObject.open()

    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Booking failed. Please try again.'
      setError(msg)
      setLoading(false)
    }
  }

  const stepLabels = ['Date & Time', 'Your Details', 'Confirmed']

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {stepLabels.map((label, i) => {
          const n = i + 1
          const active = step === n
          const done = step > n
          return (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done ? 'bg-primary text-primary-foreground' :
                active ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                'bg-muted text-muted-foreground'
              }`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : n}
              </div>
              <span className={`text-xs hidden sm:block ${active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{label}</span>
              {i < stepLabels.length - 1 && <div className={`h-px w-6 md:w-10 ${done ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          )
        })}
      </div>

      {/* Step 1: Date & Time */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">Select a Date</h2>
            </div>
            <div className="flex gap-2 flex-wrap">
              {dates.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => { setSelectedDate(value); setSelectedTime('') }}
                  className={`px-3 py-2 rounded-xl text-sm border transition-all ${
                    selectedDate === value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary text-secondary-foreground border-transparent hover:border-border'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {selectedDate && (
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Available Time Slots</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {TIME_SLOTS.map(slot => {
                  const past = isSlotPast(selectedDate, slot)
                  const selected = selectedTime === slot
                  return (
                    <button
                      key={slot}
                      disabled={past}
                      onClick={() => setSelectedTime(slot)}
                      className={`py-2.5 px-3 rounded-xl text-sm border font-medium transition-all ${
                        selected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : past
                          ? 'bg-muted text-muted-foreground/50 border-transparent cursor-not-allowed line-through'
                          : 'bg-secondary text-secondary-foreground border-transparent hover:border-border'
                      }`}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <Button
            className="w-full rounded-xl gap-1"
            disabled={!canStep1}
            onClick={() => setStep(2)}
          >
            Continue <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Step 2: Patient Details */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Patient Details</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-1">
            Appointment on <span className="font-medium text-foreground">{format(parseISO(selectedDate), 'EEEE, MMMM d')}</span> at <span className="font-medium text-foreground">{selectedTime}</span>
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="pname">Full Name</Label>
            <Input id="pname" placeholder="John Doe" value={patientName} onChange={e => setPatientName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="age">Age</Label>
            <Input id="age" type="number" min="1" max="129" placeholder="28" value={age} onChange={e => setAge(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="123 Green Street, Delhi" value={address} onChange={e => setAddress(e.target.value)} />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl gap-1" onClick={() => setStep(1)}>
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            <Button className="flex-1 rounded-xl" disabled={!canStep2 || loading} onClick={handleBook}>
              {loading ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="flex flex-col items-center text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Appointment Confirmed!</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Your appointment is booked for{' '}
              <span className="font-medium text-foreground">
                {format(parseISO(selectedDate), 'EEEE, MMMM d')}
              </span>{' '}
              at <span className="font-medium text-foreground">{selectedTime}</span>.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => { setStep(1); setSelectedDate(''); setSelectedTime(''); setPatientName(''); setAge(''); setAddress('') }}
          >
            Book Another Appointment
          </Button>
        </div>
      )}
    </div>
  )
}
