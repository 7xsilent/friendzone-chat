import React, { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

export default function CreateGroupModal({ onClose, onCreate }) {
  const { currentUser } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const allUsers = snapshot.docs.map((doc) => doc.data());
      const filtered = allUsers.filter((u) => u.uid !== currentUser.uid);
      setUsers(filtered);
    });

    return () => unsub();
  }, [currentUser]);

  const toggleUser = (user) => {
    const exists = selectedUsers.find((u) => u.uid === user.uid);

    if (exists) {
      setSelectedUsers(selectedUsers.filter((u) => u.uid !== user.uid));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleCreate = () => {
    if (!groupName.trim()) {
      alert("Enter group name!");
      return;
    }

    if (selectedUsers.length < 1) {
      alert("Select at least 1 member!");
      return;
    }

    onCreate(groupName, selectedUsers);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Create Group</h2>

        <input
          style={styles.input}
          placeholder="Group name..."
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        <h4 style={styles.subtitle}>Select Members</h4>

        <div style={styles.userList}>
          {users.map((user) => (
            <div
              key={user.uid}
              style={{
                ...styles.userCard,
                background: selectedUsers.find((u) => u.uid === user.uid)
                  ? "#3b82f6"
                  : "rgba(255,255,255,0.1)",
              }}
              onClick={() => toggleUser(user)}
            >
              <div style={styles.avatar}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={styles.username}>{user.name}</p>
                <p style={styles.email}>{user.email}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>

          <button style={styles.createBtn} onClick={handleCreate}>
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  modal: {
    width: "400px",
    maxHeight: "80vh",
    overflowY: "auto",
    background: "#111827",
    padding: "20px",
    borderRadius: "15px",
    boxShadow: "0px 0px 30px rgba(0,0,0,0.7)",
    color: "white",
  },
  title: {
    marginBottom: "10px",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    outline: "none",
    marginBottom: "15px",
  },
  subtitle: {
    marginBottom: "10px",
  },
  userList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "15px",
  },
  userCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px",
    borderRadius: "12px",
    cursor: "pointer",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#22c55e",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
    color: "white",
  },
  username: {
    margin: 0,
    fontWeight: "bold",
  },
  email: {
    margin: 0,
    fontSize: "12px",
    opacity: 0.7,
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
  },
  cancelBtn: {
    flex: 1,
    padding: "12px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    background: "#ef4444",
    color: "white",
    fontWeight: "bold",
  },
  createBtn: {
    flex: 1,
    padding: "12px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    background: "#3b82f6",
    color: "white",
    fontWeight: "bold",
  },
};
