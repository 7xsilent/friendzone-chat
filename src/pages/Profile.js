import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";
import { db } from "../firebase/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

export default function Profile() {
  const { currentUser, setCurrentUser } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleUploadProfilePic = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const url = await uploadToCloudinary(file);

      const userRef = doc(db, "users", currentUser.uid);

      await updateDoc(userRef, {
        photoURL: url,
      });

      // update local state
      setCurrentUser((prev) => ({
        ...prev,
        photoURL: url,
      }));

      alert("Profile picture updated!");
    } catch (err) {
      console.log(err);
      alert("Upload failed!");
    }

    setUploading(false);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>My Profile</h2>

      <div style={styles.card}>
        <img
          src={
            currentUser.photoURL ||
            "https://cdn-icons-png.flaticon.com/512/149/149071.png"
          }
          alt="profile"
          style={styles.avatar}
        />

        <h3 style={styles.name}>{currentUser.name}</h3>
        <p style={styles.email}>{currentUser.email}</p>

        <label style={styles.uploadBtn}>
          {uploading ? "Uploading..." : "Change Profile Pic"}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleUploadProfilePic}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },
  title: {
    position: "absolute",
    top: "30px",
    color: "white",
    fontSize: "28px",
    fontWeight: "bold",
  },
  card: {
    width: "360px",
    background: "rgba(255,255,255,0.08)",
    padding: "25px",
    borderRadius: "18px",
    textAlign: "center",
    backdropFilter: "blur(10px)",
    boxShadow: "0px 8px 25px rgba(0,0,0,0.6)",
  },
  avatar: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #3b82f6",
    marginBottom: "15px",
  },
  name: {
    color: "white",
    margin: "10px 0 5px",
  },
  email: {
    color: "rgba(255,255,255,0.7)",
    marginBottom: "20px",
  },
  uploadBtn: {
    display: "inline-block",
    background: "#22c55e",
    padding: "12px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    color: "white",
    fontWeight: "bold",
  },
};
