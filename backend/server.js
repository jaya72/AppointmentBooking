const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const http = require("http");
const { Server } = require("socket.io");

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
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "https://appointment-booking-q5o54helg-jaya-m-project.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
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
    let exists = fs.existsSync(DB_PATH);
    const patientHash = bcrypt.hashSync("password123", 10);
    const doctorHash = bcrypt.hashSync("password123", 10);
    const defaultDb = {
      users: [
        {
          _id: "offline_usr_patient_default",
          name: "Default Patient",
          phone: "9876543210",
          password: patientHash,
          role: "patient"
        },
        {
          _id: "offline_usr_doctor_default",
          name: "Dr. Smith",
          phone: "9999999999",
          password: doctorHash,
          role: "doctor",
          consultationFee: 500
        }
      ],
      appointments: [],
      messages: []
    };
    if (!exists) {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2));
      console.log(`[Offline DB] Seeding default database at: ${DB_PATH}`);
    } else {
      // Auto-migrate db.json if it still has email fields or lacks consultationFee
      const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
      let migrated = false;
      if (db.users) {
        db.users = db.users.map(u => {
          if (u.email === "patient@example.com") {
            u.phone = "9876543210";
            delete u.email;
            migrated = true;
          }
          if (u.email === "doctor@example.com") {
            u.phone = "9999999999";
            u.consultationFee = 500;
            delete u.email;
            migrated = true;
          }
          return u;
        });
      }
      if (migrated) {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        console.log(`[Offline DB] Automatically migrated existing db.json to phone/fee schemas`);
      }
    }
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch (error) {
    console.error("Error reading local db.json, returning empty structure:", error);
    return { users: [], appointments: [], messages: [] };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing to local db.json:", error);
  }
}

async function seedMongoDb() {
  try {
    // Drop the legacy email unique index in MongoDB to support phone number identifier schema
    try {
      await User.collection.dropIndex("email_1");
      console.log("[MongoDB Setup] Dropped legacy unique email index successfully");
    } catch (e) {
      // Index might not exist, already dropped, or not loaded yet
    }

    const patientHash = bcrypt.hashSync("password123", 10);
    const doctorHash = bcrypt.hashSync("password123", 10);
    
    const patientExists = await User.findOne({ phone: "9876543210" });
    if (!patientExists) {
      await User.create({
        name: "Default Patient",
        phone: "9876543210",
        password: patientHash,
        role: "patient"
      });
      console.log("[MongoDB Seed] Created default patient user");
    }

    const doctorExists = await User.findOne({ phone: "9999999999" });
    if (!doctorExists) {
      await User.create({
        name: "Default Doctor",
        phone: "9999999999",
        password: doctorHash,
        role: "doctor",
        consultationFee: 500
      });
      console.log("[MongoDB Seed] Created default doctor user");
    }
  } catch (err) {
    console.error("Error seeding MongoDB:", err);
  }
}

mongoose.connect(config.MONGO_URI, {
  tls: true,
  tlsAllowInvalidCertificates: true,
})
  .then(() => {
    console.log("MongoDB Connected Successfully");
    isDbConnected = true;
    seedMongoDb();
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
  phone: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ["patient", "doctor"] },
  consultationFee: { type: Number, default: 500 }
});

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctorId: { type: String, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  address: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  paymentStatus: { type: String, required: true, default: "PAID" },
  meetingLink: { type: String, required: true },
  isEmergency: { type: Boolean, default: false },
  amount: { type: Number, required: true }
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, enum: ["patient", "doctor"], required: true },
  text: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Appointment = mongoose.model("Appointment", appointmentSchema);
const Message = mongoose.model("Message", messageSchema);

// Offline Mode fallback classes and objects
const localUser = {
  findOne: async (query) => {
    const db = readDb();
    if (query.phone) {
      return db.users.find(u => u.phone === query.phone) || null;
    }
    if (query._id) {
      return db.users.find(u => u._id === query._id) || null;
    }
    return null;
  },
  find: async (query) => {
    const db = readDb();
    let results = db.users || [];
    if (query && query.role) {
      results = results.filter(u => u.role === query.role);
    }
    return results;
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

class localMessage {
  constructor(data) {
    this._id = `offline_msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.appointmentId = data.appointmentId;
    this.senderId = data.senderId;
    this.senderName = data.senderName;
    this.senderRole = data.senderRole;
    this.text = data.text;
    this.createdAt = new Date().toISOString();
  }

  async save() {
    const db = readDb();
    if (!db.messages) db.messages = [];
    db.messages.push({
      _id: this._id,
      appointmentId: this.appointmentId,
      senderId: this.senderId,
      senderName: this.senderName,
      senderRole: this.senderRole,
      text: this.text,
      createdAt: this.createdAt,
    });
    writeDb(db);
    return this;
  }

  static find({ appointmentId }) {
    const db = readDb();
    if (!db.messages) db.messages = [];
    return db.messages
      .filter(m => m.appointmentId === appointmentId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
}

// Simple health check endpoint
app.get("/", (req, res) => {
  res.json({ success: true, message: "Backend API is up and running" });
});

// User Registration Route
app.post("/signup", rateLimiter, async (req, res, next) => {
  try {
    const { name, phone, password, role } = req.body;

    // Server-side Input Validation
    if (!name || !phone || !password || !role) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }

    if (role !== "patient" && role !== "doctor") {
      return res.status(400).json({ success: false, error: "Role must be either 'patient' or 'doctor'" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters long" });
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ success: false, error: "Invalid phone number format. Must be 10 digits." });
    }

    // Check for duplicate account
    const existingUser = await (isDbConnected ? User.findOne({ phone }) : localUser.findOne({ phone }));
    if (existingUser) {
      return res.status(409).json({ success: false, error: "User already exists with this phone number" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = isDbConnected
      ? new User({
          name,
          phone,
          password: hashedPassword,
          role,
          consultationFee: role === "doctor" ? 500 : undefined
        })
      : new UserClass({
          name,
          phone,
          password: hashedPassword,
          role,
          consultationFee: role === "doctor" ? 500 : undefined
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
    const { phone, password } = req.body;

    // Server-side Input Validation
    if (!phone || !password) {
      return res.status(400).json({ success: false, error: "Phone number and password are required" });
    }

    // Lookup user
    const user = await (isDbConnected ? User.findOne({ phone }) : localUser.findOne({ phone }));
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid phone number or password" });
    }

    // Verify Password match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Invalid phone number or password" });
    }

    // Sign JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      config.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      role: user.role,
      userId: user._id,
      name: user.name,
      consultationFee: user.consultationFee
    });

  } catch (error) {
    next(error);
  }
});

// Create Razorpay Payment Order Endpoint (Patient only)
app.post("/pay/order", authenticateToken, requireRole(["patient"]), async (req, res, next) => {
  try {
    const { doctorId } = req.body;
    if (!doctorId) {
      return res.status(400).json({ success: false, error: "Doctor ID is required for payment" });
    }

    // Look up doctor
    let doctor;
    if (isDbConnected) {
      doctor = await User.findById(doctorId);
    } else {
      doctor = await localUser.findOne({ _id: doctorId });
    }

    const fee = doctor && doctor.consultationFee ? doctor.consultationFee : 500;
    const amount = fee * 100; // in paise

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
    const { name, age, address, date, time, doctorId, isEmergency, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    // Server-side validation
    if (!name || !age || !address || !date || !time || !doctorId) {
      return res.status(400).json({ success: false, error: "All booking fields are required, including Doctor" });
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

    // Fetch doctor's fee
    let doctor;
    if (isDbConnected) {
      doctor = await User.findById(doctorId);
    } else {
      doctor = await localUser.findOne({ _id: doctorId });
    }
    const amount = doctor && doctor.consultationFee ? doctor.consultationFee : 500;

    // Generate unique video conference identifier
    const meetingId = `doctor-app-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const paymentStatus = (razorpay_payment_id || !razorpayInstance) ? "PAID" : "PENDING";
    const meetingLink = `https://meet.jit.si/${meetingId}`;

    const newAppointment = isDbConnected
      ? new Appointment({
          userId: req.user.id, // Derived securely from authenticated JWT
          doctorId,
          name,
          age: parsedAge,
          address,
          date,
          time,
          paymentStatus,
          meetingLink,
          isEmergency: !!isEmergency,
          amount
        })
      : new AppointmentClass({
          userId: req.user.id,
          doctorId,
          name,
          age: parsedAge,
          address,
          date,
          time,
          paymentStatus,
          meetingLink,
          isEmergency: !!isEmergency,
          amount
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
        // Doctors can only view bookings assigned to them (or legacy bookings without doctorId for backward compatibility)
        appointments = await Appointment.find({
          $or: [
            { doctorId: req.user.id },
            { doctorId: { $exists: false } },
            { doctorId: null }
          ]
        }).sort({ createdAt: -1 });
      } else {
        // Patients can only view their own bookings
        appointments = await Appointment.find({ userId: req.user.id }).sort({ createdAt: -1 });
      }
    } else {
      if (req.user.role === "doctor") {
        const allApts = await localAppointment.find({}).sort({ createdAt: -1 });
        appointments = allApts.filter(a => !a.doctorId || a.doctorId === req.user.id || a.doctorId === "offline_usr_doctor_default");
      } else {
        appointments = await localAppointment.find({ userId: req.user.id }).sort({ createdAt: -1 });
      }
    }

    res.status(200).json(appointments);

  } catch (error) {
    next(error);
  }
});

// Get list of doctors and their fees
app.get("/doctors", authenticateToken, async (req, res, next) => {
  try {
    let doctors;
    if (isDbConnected) {
      doctors = await User.find({ role: "doctor" }, "_id name consultationFee");
    } else {
      doctors = await localUser.find({ role: "doctor" });
      doctors = doctors.map(d => ({ _id: d._id, name: d.name, consultationFee: d.consultationFee || 500 }));
    }
    res.status(200).json(doctors);
  } catch (error) {
    next(error);
  }
});

// Update doctor's consultation fee
app.put("/doctor/fee", authenticateToken, requireRole(["doctor"]), async (req, res, next) => {
  try {
    const { consultationFee } = req.body;
    const fee = parseInt(consultationFee, 10);

    if (isNaN(fee) || fee <= 0) {
      return res.status(400).json({ success: false, error: "Consultation fee must be a valid positive number" });
    }

    if (isDbConnected) {
      const doctor = await User.findByIdAndUpdate(
        req.user.id,
        { consultationFee: fee },
        { new: true }
      );
      if (!doctor) {
        return res.status(404).json({ success: false, error: "Doctor not found" });
      }
      res.status(200).json({ success: true, message: "Consultation fee updated successfully", consultationFee: doctor.consultationFee });
    } else {
      const db = readDb();
      const doctor = db.users.find(u => u._id === req.user.id);
      if (!doctor) {
        return res.status(404).json({ success: false, error: "Doctor not found" });
      }
      doctor.consultationFee = fee;
      writeDb(db);
      res.status(200).json({ success: true, message: "Consultation fee updated successfully (offline mode)", consultationFee: fee });
    }
  } catch (error) {
    next(error);
  }
});

// Chat History Endpoint
app.get("/messages/:appointmentId", authenticateToken, async (req, res, next) => {
  try {
    const MessageModel = mongoose.connection.readyState === 1 ? Message : localMessage;
    const messages = await MessageModel.find({ appointmentId: req.params.appointmentId });
    // Sort by createdAt ascending
    const sorted = Array.isArray(messages) ? messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) : messages;
    res.json(sorted);
  } catch (err) {
    next(err);
  }
});

// Standard Error Handling Fallback
app.use(errorHandler);

// Create HTTP server and attach Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});

// Socket.io JWT authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication required"));
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(`[Socket] User connected: ${socket.user.id} (${socket.user.role})`);

  socket.on("join-room", ({ appointmentId }) => {
    const room = `apt-${appointmentId}`;
    socket.join(room);
    console.log(`[Socket] User ${socket.user.id} joined room ${room}`);
  });

  socket.on("send-message", async ({ appointmentId, text, senderName }) => {
    try {
      const MessageModel = mongoose.connection.readyState === 1 ? Message : localMessage;
      const message = new MessageModel({
        appointmentId,
        senderId: socket.user.id,
        senderName: senderName || "Unknown",
        senderRole: socket.user.role,
        text,
      });
      await message.save();

      const room = `apt-${appointmentId}`;
      io.to(room).emit("new-message", {
        _id: message._id,
        appointmentId: message.appointmentId,
        senderId: message.senderId,
        senderName: message.senderName,
        senderRole: message.senderRole,
        text: message.text,
        createdAt: message.createdAt,
      });
    } catch (err) {
      console.error("[Socket] Error saving message:", err);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("typing", ({ appointmentId }) => {
    const room = `apt-${appointmentId}`;
    socket.to(room).emit("user-typing", {
      userId: socket.user.id,
      role: socket.user.role,
    });
  });

  socket.on("stop-typing", ({ appointmentId }) => {
    const room = `apt-${appointmentId}`;
    socket.to(room).emit("user-stop-typing", {
      userId: socket.user.id,
    });
  });

  socket.on("leave-room", ({ appointmentId }) => {
    const room = `apt-${appointmentId}`;
    socket.leave(room);
    console.log(`[Socket] User ${socket.user.id} left room ${room}`);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] User disconnected: ${socket.user.id}`);
  });
});

server.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
  console.log(`Socket.io ready for connections`);
});