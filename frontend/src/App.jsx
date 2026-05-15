import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    address: "",
    date: "",
    time: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/book",
        formData
      );

      alert(response.data.message);

      console.log(response.data);
    } catch (error) {
      console.log(error);
      alert("Error booking appointment");
    }
  };

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

      <select name="time" onChange={handleChange}>
        <option value="">Select Time</option>
        <option value="10:00 AM">10:00 AM</option>
        <option value="12:00 PM">12:00 PM</option>
        <option value="3:00 PM">3:00 PM</option>
      </select>

      <button onClick={handleSubmit}>
        Pay via UPI
      </button>
    </div>
  );
}

export default App;