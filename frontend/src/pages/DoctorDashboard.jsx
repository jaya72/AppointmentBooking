import { useEffect, useState } from "react";
import axios from "axios";

function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/appointments"
      );

      setAppointments(response.data);

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <div className="container">
      <h2>Your Patients</h2>

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
            <strong>Address:</strong> {item.address}
          </p>

          <p>
            <strong>Date:</strong> {item.date}
          </p>

          <p>
            <strong>Time:</strong> {item.time}
          </p>

          <button>
            Start Video Call
          </button>
        </div>
      ))}
    </div>
  );
}

export default DoctorDashboard;