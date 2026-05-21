const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(
  "mongodb+srv://brajwasime_db_user:QtS1aPDLzWgJLjTk@doctor-booking-cluster.zg1xh6t.mongodb.net/?appName=doctor-booking-cluster"
)
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log(err));

const appointmentSchema = new mongoose.Schema({
  name: String,
  age: String,
  address: String,
  date: String,
  time: String,
  paymentStatus: String,
  meetingLink: String,
  userId: String, // To associate appointment with a user (for feature: patient only sees his appointments)
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
});

const User = mongoose.model(
  "User",
  userSchema
);

const Appointment = mongoose.model(
  "Appointment",
  appointmentSchema
);

app.get("/", (req, res) => {
  res.send("Backend + MongoDB Working");
});

app.post("/book", async (req, res) => {
  try {
    console.log(req.body);

    //const newAppointment = new Appointment(req.body);
    const meetingId =
      "doctor-app-" + Date.now();

    const newAppointment = new Appointment({
     ...req.body,
     meetingLink:
       "https://meet.jit.si/" + meetingId,
   });

    await newAppointment.save();

    res.json({
      message: "Appointment Saved Successfully",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error saving appointment",
    });
  }
});

app.get("/appointments", async (req, res) => {
  try {
    const appointments = await Appointment.find();

    res.json(appointments);

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error fetching appointments",
    });
  }
});

app.post("/signup", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
    } = req.body;

    const existingUser =
      await User.findOne({ email });

    if (existingUser) {
      return res.json({
        message: "User already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    res.json({
      message: "Signup successful",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Signup error",
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.json({
        message: "User not found",
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return res.json({
        message: "Wrong password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      "SECRETKEY"
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      userId: user._id,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Login error",
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});