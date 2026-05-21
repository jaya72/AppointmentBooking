import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Signup() {

  const navigate = useNavigate();

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      password: "",
      role: "patient",
    });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignup = async () => {
    try {

      const response = await axios.post(
        "http://localhost:5000/signup",
        formData
      );

      alert(response.data.message);
      navigate("/login");

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="container">

      <h1>Signup</h1>

      <input
        type="text"
        name="name"
        placeholder="Enter Name"
        onChange={handleChange}
      />

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

      <button onClick={handleSignup}>
        Signup
      </button>

    </div>
  );
}

export default Signup;