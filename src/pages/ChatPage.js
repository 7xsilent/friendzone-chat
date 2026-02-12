import React, { useEffect, useState } from "react";
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

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // ✅ detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ back button in mobile
  const handleBackToSidebar = () => {
    setSelectedChat(null);
  };

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

  const handleProfile = () => {
    window.location.href = "/profile";
  };

  return (
    <div style={styles.container}>
      {/* ================= SIDEBAR ================= */}
      {(!isMobile || (isMobile && !selectedChat)) && (
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

            <button style={styles.profileBtn} onClick={handleProfile}>
              Profile
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
      )}

      {/* ================= CHAT AREA ================= */}
      {(!isMobile || (isMobile && selectedChat)) && (
        <div style={styles.chatArea}>
          <ChatWindow
            selectedChat={selectedChat}
            onExitGroup={() => setSelectedChat(null)}
            onBack={handleBackToSidebar}   // ✅ back button support
            isMobile={isMobile}           // ✅ pass mobile flag
          />
        </div>
      )}

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
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    background: "rgba(255,255,255,0.05)",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },

  btn: {
    flex: 1,
    minWidth: "120px",
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
    flex: 1,
    minWidth: "120px",
    padding: "10px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    background: "#22c55e",
    color: "white",
    fontSize: "14px",
  },

  profileBtn: {
    flex: 1,
    minWidth: "120px",
    padding: "10px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    background: "#a855f7",
    color: "white",
    fontSize: "14px",
  },

  logoutBtn: {
    flex: 1,
    minWidth: "120px",
    padding: "10px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    background: "#ef4444",
    color: "white",
    fontSize: "14px",
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
