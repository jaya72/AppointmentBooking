import axios from 'axios'

// Use the Node.js / Express backend server URL
const api = axios.create({
  baseURL: 'http://localhost:5000',
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
}

export interface Appointment {
  _id: string
  userId: string
  name: string
  age: number
  address: string
  date: string
  time: string
  paymentStatus: 'PAID' | 'PENDING'
  meetingLink: string
  createdAt?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface SignupPayload {
  name: string
  email: string
  password: string
  role: 'patient' | 'doctor'
}

export interface BookPayload {
  name: string
  age: number
  address: string
  date: string
  time: string
}
