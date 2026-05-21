import Signup from "./pages/Signup";
import Login from "./pages/LoginPage";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientPage from "./pages/PatientPage";

function App() {


  return (
    <BrowserRouter>
      <div className="container">
<Routes>

  <Route
    path="/"
    element={<PatientPage />}
  />

  <Route
  path="/dashboard"
  element={<PatientDashboard />}
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