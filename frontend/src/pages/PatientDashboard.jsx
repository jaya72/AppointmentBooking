import { useEffect, useState } from "react";
import axios from "axios";
import "../App.css";

function App() {

   const token =
    localStorage.getItem("token"); // Get token from localStorage (for feature: patient sees booking form only after login)

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    address: "",
    date: "",
    time: "",
    paymentStatus: "PAID",
    userId: localStorage.getItem("userId"), // Assuming userId is stored in localStorage after login;(for feature: patient only sees his appointments)
  });

  const [appointments, setAppointments] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/appointments"
      );

      //setAppointments(response.data);
      // Filter appointments based on logged in userId
      const loggedInUserId =
  localStorage.getItem("userId");

const filteredAppointments =
  response.data.filter(
    (item) =>
      item.userId === loggedInUserId
  );

setAppointments(filteredAppointments);

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleSubmit = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/book",
        formData
      );

      alert(response.data.message);

      fetchAppointments();

    } catch (error) {
      console.log(error);

      alert("Error booking appointment");
    }
  };

if (!token) {   // If no token, show message to login (for feature: patient sees booking form only after login)
  return (
    <div className="container">
      <h2>
        Please login to book appointment
      </h2>
    </div>
  );
}
  
  return (
    <div className="container">
      <h2>Doctor Appointment Booking</h2>

      <input
        type="text"
        name="name"
        placeholder="Patient Name"
        onChange={handleChange}
      />

      <input
        type="number"
        name="age"
        placeholder="Age"
        onChange={handleChange}
      />

      <textarea
        name="address"
        placeholder="Address"
        onChange={handleChange}
      ></textarea>

      <input
        type="date"
        name="date"
        onChange={handleChange}
      />

      <select
        name="time"
        onChange={handleChange}
      >
        <option value="">Select Time</option>
        <option value="10:00 AM">
          10:00 AM
        </option>
        <option value="12:00 PM">
          12:00 PM
        </option>
        <option value="3:00 PM">
          3:00 PM
        </option>
      </select>

      <button onClick={handleSubmit}>
        Pay via UPI
      </button>

      <h2>Your Appointments</h2>

      {appointments.map((item) => (
        <div
          key={item._id}
          className="appointment-card"
        >
          <p>
            <strong>Name:</strong> {item.name}
          </p>

          <p>
            <strong>Age:</strong> {item.age}
          </p>

          <p>
            <strong>Date:</strong> {item.date}
          </p>

          <p>
            <strong>Time:</strong> {item.time}
          </p>

          <p>
            <strong>Address:</strong> {item.address}
          </p>

          <p>
            <strong>Payment:</strong> {item.paymentStatus}
          </p>
          <a
            href={item.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <button>
              Join Video Call
            </button>

          </a>

          <p>
            <strong>Meeting Link:</strong> {item.meetingLink}
          </p>

        </div>
      ))}
    </div>
  );
}

export default App;