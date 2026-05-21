'use client'

import { useState, useEffect } from 'react'
import { format, addDays, isBefore, startOfDay, parseISO, set as setDate } from 'date-fns'
import { CalendarDays, User, CheckCircle2, ChevronLeft, ChevronRight, Stethoscope, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'

interface Doctor {
  _id: string
  name: string
  consultationFee: number
}

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
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [isEmergency, setIsEmergency] = useState(false)
  const [customTime, setCustomTime] = useState('')
  const [patientName, setPatientName] = useState('')
  const [age, setAge] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const dates = generateDateOptions()

  // Fetch doctors on mount
  useEffect(() => {
    async function loadDoctors() {
      try {
        const res = await api.get<Doctor[]>('/doctors')
        setDoctors(res.data)
        if (res.data.length > 0) {
          setSelectedDoctorId(res.data[0]._id)
        }
      } catch (err) {
        console.error('Failed to load doctors:', err)
      }
    }
    loadDoctors()
  }, [])

  const selectedDoctor = doctors.find(d => d._id === selectedDoctorId)
  const consultationFee = selectedDoctor?.consultationFee || 500

  const canStep1 = !!selectedDoctorId && !!selectedDate && (isEmergency ? customTime.trim().length > 0 : !!selectedTime)
  const canStep2 = patientName.trim().length >= 2 && parseInt(age) > 0 && parseInt(age) < 130 && address.trim().length >= 5

  async function handleBook() {
    setLoading(true)
    setError('')
    try {
      // Step A: Create payment order on backend for specific doctor
      const orderRes = await api.post('/pay/order', { doctorId: selectedDoctorId })
      const orderData = orderRes.data

      const bookingTime = isEmergency ? customTime.trim() : selectedTime

      // Step B: If mock mode is active, book directly
      if (orderData.mock) {
        console.log('[v0] Mock checkout, bypassing payment popup')
        const payload = {
          name: patientName.trim(),
          age: parseInt(age),
          address: address.trim(),
          date: selectedDate,
          time: bookingTime,
          doctorId: selectedDoctorId,
          isEmergency
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
        description: `Booking with ${selectedDoctor?.name || 'Doctor'}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          setLoading(true)
          try {
            const payload = {
              name: patientName.trim(),
              age: parseInt(age),
              address: address.trim(),
              date: selectedDate,
              time: bookingTime,
              doctorId: selectedDoctorId,
              isEmergency,
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
    <div className="clay-card p-6 md:p-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {stepLabels.map((label, i) => {
          const n = i + 1
          const active = step === n
          const done = step > n
          return (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done ? 'bg-primary text-primary-foreground shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4),2px_2px_5px_rgba(163,177,198,0.25)]' :
                active ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4),2px_2px_5px_rgba(163,177,198,0.25)]' :
                'bg-muted text-muted-foreground border border-white/60 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8),1px_1px_3px_rgba(163,177,198,0.15)]'
              }`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : n}
              </div>
              <span className={`text-xs hidden sm:block font-semibold ${active ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>{label}</span>
              {i < stepLabels.length - 1 && <div className={`h-1 w-6 md:w-10 rounded-full ${done ? 'bg-primary shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]' : 'bg-muted shadow-[inset_1px_1px_2px_rgba(163,177,198,0.2)]'}`} />}
            </div>
          )
        })}
      </div>

      {/* Step 1: Date & Time */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Doctor Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8)]">
                <Stethoscope className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-bold text-foreground text-sm tracking-tight">Select Doctor</h2>
            </div>
            {doctors.length === 0 ? (
              <p className="text-xs text-muted-foreground">Loading available doctors...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doctors.map(doc => (
                  <button
                    key={doc._id}
                    type="button"
                    onClick={() => { setSelectedDoctorId(doc._id) }}
                    className={`p-4 text-left rounded-2xl transition-all border ${
                      selectedDoctorId === doc._id
                        ? 'border-primary bg-primary/5 shadow-[inset_1px_1px_2.5px_rgba(255,255,255,0.7),3px_3px_8px_rgba(163,177,198,0.2)] scale-101'
                        : 'border-transparent clay-card hover:scale-101 active:scale-99'
                    }`}
                  >
                    <p className="font-bold text-foreground text-sm">{doc.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Consultation Fee: <span className="font-extrabold text-primary">₹{doc.consultationFee || 500}</span>
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Picker */}
          <div>
            <div className="flex items-center gap-2.5 mb-3.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8)]">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="font-bold text-foreground text-sm tracking-tight">Select a Date</h2>
            </div>
            <div className="flex gap-2 flex-wrap">
              {dates.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setSelectedDate(value); setSelectedTime('') }}
                  className={`px-3.5 py-2.5 text-sm font-semibold transition-all ${
                    selectedDate === value
                      ? 'clay-chip-selected'
                      : 'clay-chip text-muted-foreground hover:text-foreground hover:scale-102 active:scale-98'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {selectedDate && (
            <div className="space-y-4">
              {/* Emergency Toggle Switch */}
              <div className="clay-card p-4 bg-destructive/5 border border-destructive/20 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="emergency" className="font-extrabold text-destructive flex items-center gap-1.5 text-sm cursor-pointer">
                    <AlertTriangle className="w-4 h-4" /> Emergency Custom Time
                  </Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Need immediate assistance? Select a custom time slot instead of preset intervals.
                  </p>
                </div>
                <button
                  id="emergency"
                  type="button"
                  onClick={() => {
                    setIsEmergency(!isEmergency);
                    setSelectedTime('');
                    setCustomTime('');
                  }}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors flex items-center ${
                    isEmergency ? 'bg-destructive shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.15)]' : 'bg-muted shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.1)]'
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-[1px_1px_3px_rgba(0,0,0,0.2)] ${
                      isEmergency ? 'translate-x-5.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {isEmergency ? (
                <div className="space-y-2">
                  <Label htmlFor="customTime" className="text-xs font-bold text-muted-foreground tracking-wide uppercase">Custom Time / Urgency Note</Label>
                  <Input
                    id="customTime"
                    placeholder="e.g. ASAP, 2:30 AM, Within 30 minutes"
                    className="clay-input"
                    value={customTime}
                    onChange={e => setCustomTime(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-foreground tracking-tight">Available Time Slots</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {TIME_SLOTS.map(slot => {
                      const past = isSlotPast(selectedDate, slot)
                      const selected = selectedTime === slot
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={past}
                          onClick={() => setSelectedTime(slot)}
                          className={`py-2.5 px-3 text-sm font-semibold transition-all ${
                            selected
                              ? 'clay-chip-selected'
                              : past
                              ? 'bg-muted text-muted-foreground/30 border border-transparent cursor-not-allowed line-through opacity-50 py-2.5 px-3 rounded-xl'
                              : 'clay-chip text-muted-foreground hover:text-foreground hover:scale-102 active:scale-98'
                          }`}
                        >
                          {slot}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            className="w-full clay-btn py-6 gap-1"
            disabled={!canStep1}
            onClick={() => setStep(2)}
          >
            Continue <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Step 2: Patient Details */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8)]">
              <User className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="font-bold text-foreground text-sm tracking-tight">Patient Details</h2>
          </div>
          <div className="clay-alert-success px-4 py-3 flex flex-col gap-1 text-xs font-semibold">
            <div>
              Appointment with <span className="font-extrabold text-primary">{selectedDoctor?.name}</span>
            </div>
            <div>
              Scheduled on <span className="font-extrabold">{format(parseISO(selectedDate), 'EEEE, MMMM d')}</span> at <span className="font-extrabold">{isEmergency ? customTime : selectedTime}</span>
            </div>
            <div className="mt-1 pt-1 border-t border-emerald-200/50 flex justify-between font-bold">
              <span>Consultation Fee:</span>
              <span className="text-primary font-black">₹{consultationFee}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pname" className="text-xs font-bold text-muted-foreground tracking-wide uppercase">Full Name</Label>
            <Input id="pname" placeholder="John Doe" className="clay-input" value={patientName} onChange={e => setPatientName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="age" className="text-xs font-bold text-muted-foreground tracking-wide uppercase">Age</Label>
            <Input id="age" type="number" min="1" max="129" placeholder="28" className="clay-input" value={age} onChange={e => setAge(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-bold text-muted-foreground tracking-wide uppercase">Address</Label>
            <Input id="address" placeholder="123 Green Street, Delhi" className="clay-input" value={address} onChange={e => setAddress(e.target.value)} />
          </div>

          {error && (
            <div className="clay-alert-error text-xs font-semibold px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1 clay-btn-secondary py-5 gap-1 text-xs" onClick={() => setStep(1)}>
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            <Button className="flex-1 clay-btn py-5 text-xs font-bold" disabled={!canStep2 || loading} onClick={handleBook}>
              {loading ? 'Processing...' : `Pay ₹${consultationFee} & Book`}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="flex flex-col items-center text-center py-6 space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-[inset_1.5px_1.5px_3px_rgba(255,255,255,0.8),4px_4px_10px_rgba(163,177,198,0.2)] animate-bounce">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Appointment Confirmed!</h2>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Your appointment with <span className="font-extrabold text-foreground">{selectedDoctor?.name}</span> is booked for{' '}
              <span className="font-bold text-foreground">
                {format(parseISO(selectedDate), 'EEEE, MMMM d')}
              </span>{' '}
              at <span className="font-bold text-foreground">{isEmergency ? customTime : selectedTime}</span>.
            </p>
            <p className="text-xs font-extrabold text-primary pt-1">
              Paid: ₹{consultationFee} (Payment ID: Confirmed)
            </p>
          </div>
          <Button
            className="clay-btn-secondary px-6 py-5 text-sm"
            onClick={() => {
              setStep(1)
              setSelectedDate('')
              setSelectedTime('')
              setIsEmergency(false)
              setCustomTime('')
              setPatientName('')
              setAge('')
              setAddress('')
            }}
          >
            Book Another Appointment
          </Button>
        </div>
      )}
    </div>
  )
}
