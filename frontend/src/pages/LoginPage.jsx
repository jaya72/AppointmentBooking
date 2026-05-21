import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
const navigate = useNavigate();
  const [formData, setFormData] =
    useState({
      email: "",
      password: "",
    });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async () => {
    try {

      const response = await axios.post(
        "http://localhost:5000/login",
        formData
      );

      alert(response.data.message);

      localStorage.setItem(
        "token",
        response.data.token
      );

      localStorage.setItem(
        "role",
        response.data.role
      );

      localStorage.setItem(
        "userId",
        response.data.userId
      );
      navigate("/dashboard");

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="container">

      <h1>Login</h1>

      <input
        type="email"
        name="email"
        placeholder="Enter Email"
        onChange={handleChange}
      />

      <input
        type="password"
        name="password"
        placeholder="Enter Password"
        onChange={handleChange}
      />

      <button onClick={handleLogin}>
        Login
      </button>

    </div>
  );
}

export default Login;