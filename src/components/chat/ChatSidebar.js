import React, { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

export default function ChatSidebar({ onSelectUser }) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!currentUser) return;

    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const allUsers = snapshot.docs.map((doc) => doc.data());
      const filtered = allUsers.filter((u) => u.uid !== currentUser.uid);
      setUsers(filtered);
    });

    return () => unsub();
  }, [currentUser]);

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.sidebar}>
      <h2 style={styles.title}>Users</h2>

      <input
        style={styles.search}
        placeholder="Search friends..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div style={styles.userList}>
        {filteredUsers.map((user) => (
          <div
            key={user.uid}
            style={styles.userCard}
            onClick={() => onSelectUser(user)}
          >
            {/* PROFILE PIC */}
            {user.photoURL ? (
              <img src={user.photoURL} alt="profile" style={styles.avatarImg} />
            ) : (
              <div style={styles.avatarText}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )}

            <div style={{ flex: 1 }}>
              <p style={styles.username}>{user.name}</p>
              <p style={styles.email}>{user.email}</p>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <p style={styles.noUsers}>No users found</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: "100%",
    height: "100%",
    padding: "15px",
    overflowY: "auto",
  },

  title: {
    color: "white",
    marginBottom: "10px",
    fontSize: "20px",
    fontWeight: "800",
  },

  search: {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.15)",
    outline: "none",
    marginBottom: "15px",
    background: "rgba(255,255,255,0.08)",
    color: "white",
  },

  userList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  userCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    borderRadius: "14px",
    cursor: "pointer",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    transition: "0.3s",
  },

  avatarImg: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(59,130,246,0.8)",
    flexShrink: 0,
  },

  avatarText: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    fontWeight: "bold",
    fontSize: "18px",
    flexShrink: 0,
  },

  username: {
    color: "white",
    margin: 0,
    fontWeight: "bold",
    fontSize: "15px",
  },

  email: {
    color: "rgba(255,255,255,0.6)",
    margin: "3px 0 0 0",
    fontSize: "12px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "180px",
  },

  noUsers: {
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginTop: "20px",
  },
};
