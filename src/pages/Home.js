import React from "react";
import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../firebase/authService";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>FriendZone Chat</h1>

      {currentUser ? (
        <>
          <h2 style={styles.text}>Welcome, {currentUser.name}</h2>
          <p style={styles.textSmall}>{currentUser.email}</p>

          <button style={styles.button} onClick={handleLogout}>
            Logout
          </button>
        </>
      ) : (
        <button style={styles.button} onClick={() => navigate("/login")}>
          Login
        </button>
      )}
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    background: "linear-gradient(135deg, #111827, #1f2937)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    color: "white",
  },
  title: {
    fontSize: "40px",
    marginBottom: "20px",
  },
  text: {
    fontSize: "22px",
  },
  textSmall: {
    fontSize: "16px",
    opacity: 0.8,
  },
  button: {
    marginTop: "20px",
    padding: "12px 25px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    background: "#3b82f6",
    color: "white",
  },
};
