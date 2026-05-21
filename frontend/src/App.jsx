import Signup from "./pages/Signup";
import Login from "./pages/LoginPage";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";

import PatientPage from "./pages/PatientPage";
import DoctorDashboard from "./pages/DoctorDashboard";

function App() {

  const handleLogout = () => {

  localStorage.removeItem("token");

  localStorage.removeItem("userId");

  localStorage.removeItem("role");

  window.location.reload();
};

  return (
    <BrowserRouter>
      <div className="container">

        <h2>Doctor Appointment App</h2>

       <div style={{ marginBottom: "20px" }}>
        <button
  onClick={handleLogout}
  style={{ marginLeft: "10px" }}
>
  Logout
</button>

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

<Routes>

  <Route
    path="/"
    element={<PatientPage />}
  />

  <Route
    path="/doctor"
    element={<DoctorDashboard />}
  />

  <Route
    path="/signup"
    element={<Signup />}
  />

  <Route
  path="/login"
  element={<Login />}
    />

</Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;