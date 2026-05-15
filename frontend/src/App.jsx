import {
  BrowserRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";

import PatientPage from "./pages/PatientPage";
import DoctorDashboard from "./pages/DoctorDashboard";

function App() {
  return (
    <BrowserRouter>
      <div className="container">

        <h2>Doctor Appointment App</h2>

        <div style={{ marginBottom: "20px" }}>
          <Link to="/">
            <button>
              Patient Page
            </button>
          </Link>

          <Link to="/doctor">
            <button style={{ marginLeft: "10px" }}>
              Doctor Dashboard
            </button>
          </Link>
        </div>

        <Routes>
          <Route
            path="/"
            element={<PatientPage />}
          />

          <Route
            path="/doctor"
            element={<DoctorDashboard />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;