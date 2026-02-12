import React, { useState } from "react";
import RecentChatsSidebar from "../components/chat/RecentChatsSidebar";
import ChatSidebar from "../components/chat/ChatSidebar";
import ChatWindow from "../components/chat/ChatWindow";
import CreateGroupModal from "../components/group/CreateGroupModal";

import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../firebase/authService";
import { generateChatId } from "../utils/generateChatId";
import { createChatIfNotExists, createGroupChat } from "../firebase/chatService";

export default function ChatPage() {
  const { currentUser } = useAuth();

  const [selectedChat, setSelectedChat] = useState(null);
  const [showUsers, setShowUsers] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const handleSelectUser = async (user) => {
    if (!currentUser || !user) return;

    const chatId = generateChatId(currentUser.uid, user.uid);

    const memberDetails = {
      [currentUser.uid]: {
        name: currentUser.name,
        email: currentUser.email,
        photoURL: currentUser.photoURL || "",
      },
      [user.uid]: {
        name: user.name,
        email: user.email,
        photoURL: user.photoURL || "",
      },
    };

    await createChatIfNotExists(chatId, [currentUser.uid, user.uid], memberDetails);

    setSelectedChat({
      chatId,
      name: user.name,
      isGroup: false,
      photoURL: user.photoURL || "",
    });

    setShowUsers(false);
  };

  const handleCreateGroup = async (groupName, membersList) => {
    if (!currentUser) return;

    const memberIds = [currentUser.uid, ...membersList.map((u) => u.uid)];

    const memberDetails = {
      [currentUser.uid]: {
        name: currentUser.name,
        email: currentUser.email,
        photoURL: currentUser.photoURL || "",
      },
    };

    membersList.forEach((m) => {
      memberDetails[m.uid] = {
        name: m.name,
        email: m.email,
        photoURL: m.photoURL || "",
      };
    });

    const chatId = await createGroupChat(
      groupName,
      memberIds,
      currentUser.uid,
      memberDetails
    );

    setSelectedChat({
      chatId,
      name: groupName,
      isGroup: true,
      photoURL: "",
    });

    setShowGroupModal(false);
  };

  const handleLogout = async () => {
    await logoutUser(currentUser.uid);
    window.location.href = "/login";
  };

  return (
    <div style={styles.container}>
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <div style={styles.topBar}>
          <button style={styles.btn} onClick={() => setShowUsers(false)}>
            Chats
          </button>

          <button style={styles.btn} onClick={() => setShowUsers(true)}>
            Users
          </button>

          <button style={styles.groupBtn} onClick={() => setShowGroupModal(true)}>
            + Group
          </button>

          {/* ✅ PROFILE BUTTON */}
          <button
            style={styles.profileBtn}
            onClick={() => (window.location.href = "/profile")}
          >
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="me" style={styles.profileImg} />
            ) : (
              "👤"
            )}
          </button>

          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div style={styles.sidebarContent}>
          {showUsers ? (
            <ChatSidebar onSelectUser={handleSelectUser} />
          ) : (
            <RecentChatsSidebar onSelectChat={setSelectedChat} />
          )}
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={styles.chatArea}>
        <ChatWindow
          selectedChat={selectedChat}
          onExitGroup={() => setSelectedChat(null)}
        />
      </div>

      {showGroupModal && (
        <CreateGroupModal
          onClose={() => setShowGroupModal(false)}
          onCreate={handleCreateGroup}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    width: "100%",
    display: "flex",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    overflow: "hidden",
  },

  sidebar: {
    width: "320px",
    minWidth: "320px",
    height: "100vh",
    background: "rgba(255,255,255,0.06)",
    borderRight: "1px solid rgba(255,255,255,0.12)",
    display: "flex",
    flexDirection: "column",
  },

  topBar: {
    padding: "12px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    gridAutoRows: "45px",
    background: "rgba(255,255,255,0.05)",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },

  btn: {
    padding: "10px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    background: "#3b82f6",
    color: "white",
    fontSize: "14px",
  },

  groupBtn: {
    padding: "10px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    background: "#22c55e",
    color: "white",
    fontSize: "14px",
  },

  logoutBtn: {
    padding: "10px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    background: "#ef4444",
    color: "white",
    fontSize: "14px",
  },

  profileBtn: {
    padding: "10px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    background: "rgba(255,255,255,0.15)",
    color: "white",
    fontSize: "16px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  profileImg: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #3b82f6",
  },

  sidebarContent: {
    flex: 1,
    overflowY: "auto",
    padding: "10px",
  },

  chatArea: {
    flex: 1,
    height: "100vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
};
