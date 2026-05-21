const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const config = require("./config");
const {
  logger,
  authenticateToken,
  requireRole,
  rateLimiter,
  errorHandler
} = require("./middleware");

const app = express();

// Initialize Razorpay SDK
let razorpayInstance = null;
if (config.RAZORPAY_KEY_ID && config.RAZORPAY_KEY_ID !== "rzp_test_YOUR_KEY_ID") {
  try {
    razorpayInstance = new Razorpay({
      key_id: config.RAZORPAY_KEY_ID,
      key_secret: config.RAZORPAY_KEY_SECRET
    });
    console.log("Razorpay SDK Initialized successfully");
  } catch (error) {
    console.error("Razorpay initialization error:", error);
  }
}

// Security and Logging Middleware
app.use(logger);
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// MongoDB Connection
const fs = require("fs");
const path = require("path");
const DB_PATH = path.join(__dirname, "db.json");

let isDbConnected = false;

// Pre-seed local JSON DB helper if MongoDB connection fails
function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const patientHash = bcrypt.hashSync("password123", 10);
      const doctorHash = bcrypt.hashSync("password123", 10);
      const defaultDb = {
        users: [
          {
            _id: "offline_usr_patient_default",
            name: "Default Patient",
            email: "patient@example.com",
            password: patientHash,
            role: "patient"
          },
          {
            _id: "offline_usr_doctor_default",
            name: "Dr. Smith",
            email: "doctor@example.com",
            password: doctorHash,
            role: "doctor"
          }
        ],
        appointments: []
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2));
      console.log(`[Offline DB] Seeding default database at: ${DB_PATH}`);
    }
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch (error) {
    console.error("Error reading local db.json, returning empty structure:", error);
    return { users: [], appointments: [] };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing to local db.json:", error);
  }
}

mongoose.connect(config.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");
    isDbConnected = true;
  })
  .catch((err) => {
    console.error("MongoDB Connection Failure:", err.message);
    console.warn("WARNING: Backend is running in OFFLINE-RESILIENT mode using local db.json.");
    isDbConnected = false;
    // Trigger seed creation
    readDb();
  });

// Database Connection Check Middleware (Offline Resilient)
app.use((req, res, next) => {
  if (req.path === "/" || req.path === "/health") {
    return next();
  }
  if (!isDbConnected) {
    console.log(`[Offline DB Fallback] Routing request: ${req.method} ${req.path}`);
  }
  next();
});

// Database Schemas and Models (Mongoose)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ["patient", "doctor"] }
});

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  address: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  paymentStatus: { type: String, required: true, default: "PAID" },
  meetingLink: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Appointment = mongoose.model("Appointment", appointmentSchema);

// Offline Mode fallback classes and objects
const localUser = {
  findOne: async (query) => {
    const db = readDb();
    if (query.email) {
      const emailLower = query.email.toLowerCase();
      return db.users.find(u => u.email === emailLower) || null;
    }
    return null;
  }
};

class UserClass {
  constructor(data) {
    this.data = data;
  }
  async save() {
    const db = readDb();
    const newUser = {
      _id: `offline_usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      ...this.data
    };
    db.users.push(newUser);
    writeDb(db);
    return newUser;
  }
}

const localAppointment = {
  find: (query) => {
    const execFind = async () => {
      const db = readDb();
      let results = db.appointments;
      if (query && query.userId) {
        results = results.filter(a => a.userId === query.userId);
      }
      return results;
    };

    const chain = {
      sort: (sortQuery) => {
        return {
          then: async (resolve) => {
            const data = await execFind();
            const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            if (resolve) resolve(sorted);
            return sorted;
          }
        };
      },
      then: async (resolve) => {
        const data = await execFind();
        if (resolve) resolve(data);
        return data;
      }
    };
    return chain;
  }
};

class AppointmentClass {
  constructor(data) {
    this.data = data;
  }
  async save() {
    const db = readDb();
    const newAppointment = {
      _id: `offline_apt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      ...this.data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.appointments.push(newAppointment);
    writeDb(db);
    return newAppointment;
  }
}

// Simple health check endpoint
app.get("/", (req, res) => {
  res.json({ success: true, message: "Backend API is up and running" });
});

// User Registration Route
app.post("/signup", rateLimiter, async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Server-side Input Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }

    if (role !== "patient" && role !== "doctor") {
      return res.status(400).json({ success: false, error: "Role must be either 'patient' or 'doctor'" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters long" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: "Invalid email format" });
    }

    // Check for duplicate account
    const existingUser = await (isDbConnected ? User.findOne({ email: email.toLowerCase() }) : localUser.findOne({ email: email.toLowerCase() }));
    if (existingUser) {
      return res.status(409).json({ success: false, error: "User already exists with this email" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = isDbConnected
      ? new User({
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role
        })
      : new UserClass({
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role
        });

    await newUser.save();
    res.status(201).json({ success: true, message: "Signup successful" });

  } catch (error) {
    next(error);
  }
});

// User Login Route
app.post("/login", rateLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Server-side Input Validation
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    // Lookup user
    const user = await (isDbConnected ? User.findOne({ email: email.toLowerCase() }) : localUser.findOne({ email: email.toLowerCase() }));
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    // Verify Password match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    // Sign JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      role: user.role,
      userId: user._id
    });

  } catch (error) {
    next(error);
  }
});

// Create Razorpay Payment Order Endpoint (Patient only)
app.post("/pay/order", authenticateToken, requireRole(["patient"]), async (req, res, next) => {
  try {
    const amount = 50000; // Rs 500.00 in paise

    if (!razorpayInstance) {
      // Sandbox/Mock Mode fallback if credentials are not configured
      console.log("Using Mock Razorpay Order ID (Razorpay not configured in .env)");
      return res.status(200).json({
        success: true,
        mock: true,
        keyId: "rzp_test_mock_key_id_12345",
        orderId: `order_mock_${Date.now()}`,
        amount
      });
    }

    const options = {
      amount,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`
    };

    const order = await razorpayInstance.orders.create(options);
    res.status(200).json({
      success: true,
      mock: false,
      keyId: config.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount
    });

  } catch (error) {
    next(error);
  }
});

// Book an Appointment Endpoint (Patient only)
app.post("/book", authenticateToken, requireRole(["patient"]), async (req, res, next) => {
  try {
    const { name, age, address, date, time, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    // Server-side validation
    if (!name || !age || !address || !date || !time) {
      return res.status(400).json({ success: false, error: "All booking fields are required" });
    }

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge <= 0) {
      return res.status(400).json({ success: false, error: "Age must be a valid positive number" });
    }

    // Verify payment signature if provided and Razorpay is active
    if (razorpayInstance && razorpay_payment_id && razorpay_order_id && razorpay_signature) {
      const hmac = crypto.createHmac("sha256", config.RAZORPAY_KEY_SECRET);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const generated_signature = hmac.digest("hex");
      if (generated_signature !== razorpay_signature) {
        return res.status(400).json({ success: false, error: "Razorpay signature verification failed. Payment is invalid." });
      }
    }

    // Generate unique video conference identifier
    const meetingId = `doctor-app-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const paymentStatus = (razorpay_payment_id || !razorpayInstance) ? "PAID" : "PENDING";
    const meetingLink = `https://meet.jit.si/${meetingId}`;

    const newAppointment = isDbConnected
      ? new Appointment({
          userId: req.user.id, // Derived securely from authenticated JWT
          name,
          age: parsedAge,
          address,
          date,
          time,
          paymentStatus,
          meetingLink
        })
      : new AppointmentClass({
          userId: req.user.id,
          name,
          age: parsedAge,
          address,
          date,
          time,
          paymentStatus,
          meetingLink
        });

    await newAppointment.save();

    res.status(201).json({
      success: true,
      message: "Appointment Saved Successfully",
      appointment: newAppointment
    });

  } catch (error) {
    next(error);
  }
});

// Fetch Appointments Endpoint (Protected, Role-based)
app.get("/appointments", authenticateToken, async (req, res, next) => {
  try {
    let appointments;

    if (isDbConnected) {
      if (req.user.role === "doctor") {
        // Doctors can view all bookings
        appointments = await Appointment.find().sort({ createdAt: -1 });
      } else {
        // Patients can only view their own bookings
        appointments = await Appointment.find({ userId: req.user.id }).sort({ createdAt: -1 });
      }
    } else {
      if (req.user.role === "doctor") {
        appointments = await localAppointment.find({}).sort({ createdAt: -1 });
      } else {
        appointments = await localAppointment.find({ userId: req.user.id }).sort({ createdAt: -1 });
      }
    }

    res.status(200).json(appointments);

  } catch (error) {
    next(error);
  }
});

// Standard Error Handling Fallback
app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});