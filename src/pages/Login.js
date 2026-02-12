import React, { useState } from "react";
import { loginUser } from "../firebase/authService";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await loginUser(email, password);
      navigate("/chat");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={handleLogin}>
        <h2 style={styles.title}>Login</h2>

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
          Login
        </button>

        <p style={styles.text}>
          Don’t have an account?{" "}
          <span style={styles.link} onClick={() => navigate("/register")}>
            Register
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
    backdropFilter: "blur(12px)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  title: {
    color: "white",
    textAlign: "center",
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
    background: "#3b82f6",
    color: "white",
    fontWeight: "bold",
  },
  text: {
    color: "white",
    textAlign: "center",
    fontSize: "14px",
  },
  link: {
    color: "#22c55e",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
