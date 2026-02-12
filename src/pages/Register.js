import React, { useState } from "react";
import { registerUser } from "../firebase/authService";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      alert("Please fill all fields!");
      return;
    }

    try {
      await registerUser(name, email, password);
      alert("Registration Successful!");
      navigate("/chat");
    } catch (error) {
      console.log(error);
      alert(error.message);
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={handleRegister}>
        <h2 style={{ color: "white" }}>Create Account</h2>

        <input
          style={styles.input}
          placeholder="Enter Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Enter Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button style={styles.btn} type="submit">
          Register
        </button>

        <p style={{ color: "white" }}>
          Already have an account?{" "}
          <span
            style={{ color: "#22c55e", cursor: "pointer" }}
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
  },
  form: {
    width: "350px",
    padding: "25px",
    borderRadius: "15px",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    outline: "none",
  },
  btn: {
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    background: "#22c55e",
    color: "white",
    fontWeight: "bold",
  },
};
