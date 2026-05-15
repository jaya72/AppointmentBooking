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
});

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

    const newAppointment = new Appointment(req.body);

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

app.listen(5000, () => {
  console.log("Server running on port 5000");
});