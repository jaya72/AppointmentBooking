import axios from 'axios'

// Use the Node.js / Express backend server URL
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
}, (error) => Promise.reject(error))

export default api

// --- Types ---
export interface User {
  userId: string
  role: 'patient' | 'doctor'
  name?: string
  token: string
  phone?: string
  consultationFee?: number
}

export interface Appointment {
  _id: string
  userId: string
  doctorId: string
  name: string
  age: number
  address: string
  date: string
  time: string
  paymentStatus: 'PAID' | 'PENDING'
  meetingLink: string
  isEmergency?: boolean
  amount?: number
  createdAt?: string
}

export interface LoginPayload {
  phone: string
  password: string
}

export interface SignupPayload {
  name: string
  phone: string
  password: string
  role: 'patient' | 'doctor'
}

export interface BookPayload {
  name: string
  age: number
  address: string
  date: string
  time: string
  doctorId: string
  isEmergency?: boolean
}

export interface Message {
  _id: string
  appointmentId: string
  senderId: string
  senderName: string
  senderRole: 'patient' | 'doctor'
  text: string
  createdAt: string
}

export const fetchMessages = (appointmentId: string) =>
  api.get<Message[]>(`/messages/${appointmentId}`)
