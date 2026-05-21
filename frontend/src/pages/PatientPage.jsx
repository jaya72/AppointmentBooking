import { Link } from "react-router-dom";

function PatientPage() {

  return (
    <div className="container">

      <h2>
        Doctor Appointment App
      </h2>

      <Link to="/doctor">
        <button>
          Doctor Dashboard
        </button>
      </Link>

      <Link to="/signup">
        <button style={{ marginLeft: "10px" }}>
          Signup
        </button>
      </Link>

      <Link to="/login">
        <button style={{ marginLeft: "10px" }}>
          Login
        </button>
      </Link>

    </div>
  );
}

export default PatientPage;