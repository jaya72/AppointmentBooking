# 🏥 Doctor Appointment Booking App

AI-enabled realtime telemedicine and emergency consultation platform.: Premium Neumorphic Doctor Appointment Booking Portal

MediBook# Doctor Appointment Booking App

AI-enabled realtime telemedicine and emergency consultation platform. is a premium, secure, and production-grade web application engineered for booking medical consultations. Built on the **MERN stack**, the platform is completely customized with a high-end tactile skeuomorphic design interface matching the **Product UI Styleguide (Claymorphic / Neumorphic Theme)**.

---

## 🎨 Design System & Aesthetics (Product UI Styleguide)

The application utilizes dynamic visual depth states, giving elements a premium 3D tactile appearance:
*   **Warm Slate Canvas (`#F3F4F6`):** The default light canvas color, providing visual contrast with the white highlights of extruded components.
*   **Extruded Clay Cards (`.clay-card`):** Soft 3D panels with dynamic light/shadow borders (`rgba(255, 255, 255, 0.9)` top-left, `rgba(163, 177, 198, 0.35)` bottom-right) and elevation layers (Level 1 to 5).
*   **Interactive Hover Animations:** Dynamic translations (`translateY(-4px) scale(1.01)`) with expanded shadow fields on hover.
*   **Sunken Panels (`.clay-inset`):** Inner inset shadow regions utilized for search bars, profile status badges, and appointment highlights.
*   **Shiny Mint Gradient Action Buttons (`.clay-btn`):** High-contrast emerald green action buttons that feature responsive glowing active boundaries.
*   **Tactile Tab Tracks:** Sunken pill slots supporting sliding active indicator buttons.
*   **Harmonious Alerts & Chips:** Soft yellow warning banners, success alerts, and custom status chips.

---

## 🛡️ Robust Security & Middleware Architecture

Doctor Booking Appointment is hardened against common security threats:
*   **JWT Bearer Verification:** Access to protected patient and doctor dashboard data is guarded by JSON Web Token verification middleware.
*   **Role-Based Access Control (RBAC):** Strict checks enforce route segregation between `PATIENT` and `DOCTOR` profiles.
*   **Input Sanitization & Schema Validation:** Validation checks enforce strict typing on the backend for email validation, age ranges, address lengths, and parameters.
*   **Rate Limiting Protection:** Anti-brute-force rate limiters secure `/signup` and `/login` routes on the backend.
*   **Centralized Error Fallbacks:** Express interceptors capture system faults and return normalized JSON error outputs.

---

## 🔌 Core Service Integrations

1.  **Razorpay Sandbox Payments:**
    *   Secure backend order generation mapped to customized checkout script libraries.
    *   Automatic Razorpay signature checksum verification utilizing HMAC-SHA256 hashes.
    *   Robust client modal handling representing transaction states.
2.  **Jitsi Video Consultations:**
    *   Dynamic, secure private room generation combining date and appointment records.
    *   One-click, fully responsive Jitsi Meet iframe panels for immediate remote consultations.
3.  **Offline-Resiliency Database Fallback:**
    *   To bypass strict MongoDB Atlas IP whitelisting rules during testing, the backend features an automatic database fallback.
    *   If Atlas fails to connect, the server launches an **Offline-Resilient Mode** using local JSON storage (`db.json`) inside the backend directory, pre-seeding patient/doctor accounts for testing.

---

## 🛠️ Technological Stack

*   **Frontend:** Next.js 16 (Turbopack compiler), Tailwind CSS v4, TypeScript, React 19, Radix UI Primitives, SWR, Axios.
*   **Backend:** Node.js, Express, MongoDB Atlas / Mongoose (with local JSON fallback).
*   **Payment Gateway:** Razorpay SDK.
*   **Telehealth Integrations:** Jitsi Meet API.

---

## 📂 Project Structure

```text
├── backend/                  # Express REST API Server
│   ├── config.js             # Environment-backed configurations
│   ├── middleware.js         # JWT Verification, Logger, Rate-Limiters, Error Handlers
│   ├── server.js             # Main server logic, routing, and input validation rules
│   ├── db.json               # Offline fallback database (auto-seeded)
│   └── package.json
│
└── frontend/                 # Next.js 16 Web Application
    ├── app/                  # Next.js App Router (Turbopack)
    │   ├── (auth)/           # Authentication Screens (Claymorphic Login & Signup)
    │   ├── (dashboard)/      # Dashboard Screens (Patient Panel & Doctor Board)
    │   ├── globals.css       # Premium Claymorphic Design System Tokens & Style rules
    │   └── layout.tsx        # Global Session Provider Context
    ├── components/           # Core Reusable UI Modules
    │   ├── patient/          # Booking form, Date Selectors, Patient Appointment lists
    │   ├── doctor/           # Metrics cards, Scheduled Timelines, Slide-in drawers
    │   └── ui/               # Radix & Tailwind custom primitives
    ├── lib/                  # Axios APIs Client
    └── package.json
```

---

## 🚀 Step-by-Step Installation & Running Guide

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org) (v18 or higher) and [npm](https://www.npmjs.com) installed.

### 2. Environment Configurations
Create a `.env` file inside the `backend/` directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://brajwasime_db_user:QtS1aPDLzWgJLjTk@doctor-booking-cluster.zg1xh6t.mongodb.net/?appName=doctor-booking-cluster
JWT_SECRET=super_secret_medi_key_2026
RAZORPAY_KEY_ID=rzp_test_Spo9AsHEQfYcW1
RAZORPAY_KEY_SECRET=eKRnyX26LZfuzE71d0jwkHpw
```

### 3. Startup the Express Backend
Navigate to the `backend/` directory, install dependencies, and start the server:
```powershell
cd backend
npm install
npm run dev
```
*(Starts on `http://localhost:5000`. If MongoDB Atlas is blocked by IP-whitelist rules, it will output a warning and run in **Offline-Resilient Mode** using `db.json` automatically).*

### 4. Startup the Next.js Frontend
Navigate to the `frontend/` directory, install dependencies, and run the Turbopack dev server:
```powershell
cd ../frontend
npm install --legacy-peer-deps
npm run dev
```
*(Starts on `http://localhost:3000`)*

---

## 🧪 Seeding & Sandbox Testing Credentials

Use these pre-seeded testing profiles to evaluate the system immediately:

### Patient Testing Session
*   **Email:** `patient@example.com`
*   **Password:** `password123`
*   **Testing Flow:** Log in, select **Book Appointment**, select Date & Time slot, enter details, and confirm. In offline/mock mode, the transaction will book directly; on online mode, the Razorpay payment modal loads for sandbox checkout. Once completed, the visit will register in **My Appointments** as **PAID** with a Jitsi meeting join option.

### Doctor Schedule Session
*   **Email:** `doctor@example.com`
*   **Password:** `password123`
*   **Testing Flow:** Log in to inspect the schedule metrics (extruding cards). View patients mapped out in the timeline, expand date groups, and click patient records to slide out the **Patient Details Drawer** and start the Jitsi video call.
