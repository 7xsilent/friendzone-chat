import React, { useState } from "react";
import RecentChatsSidebar from "../components/chat/RecentChatsSidebar";
import ChatSidebar from "../components/chat/ChatSidebar";
import ChatWindow from "../components/chat/ChatWindow";
import CreateGroupModal from "../components/group/CreateGroupModal";

import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../firebase/authService";
import { generateChatId } from "../utils/generateChatId";
import { createChatIfNotExists, createGroupChat } from "../firebase/chatService";

import "./chatpage.css";

export default function ChatPage() {
  const { currentUser } = useAuth();

  const [selectedChat, setSelectedChat] = useState(null);
  const [showUsers, setShowUsers] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  // ✅ Mobile screen detection
  const isMobile = window.innerWidth <= 768;

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

  // ✅ Back button logic (mobile)
  const handleBack = () => {
    setSelectedChat(null);
  };

  return (
    <div className="chat-container">
      {/* SIDEBAR */}
      {(!isMobile || !selectedChat) && (
        <div className="chat-sidebar">
          <div className="top-buttons">
            <button className="btn" onClick={() => setShowUsers(false)}>
              Chats
            </button>

            <button className="btn" onClick={() => setShowUsers(true)}>
              Users
            </button>

            <button className="groupBtn" onClick={() => setShowGroupModal(true)}>
              + Group
            </button>

            <button className="logoutBtn" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <div className="sidebar-content">
            {showUsers ? (
              <ChatSidebar onSelectUser={handleSelectUser} />
            ) : (
              <RecentChatsSidebar onSelectChat={setSelectedChat} />
            )}
          </div>
        </div>
      )}

      {/* CHAT AREA */}
      {(!isMobile || selectedChat) && (
        <div className="chat-area">
          {/* ✅ Mobile back button */}
          {isMobile && selectedChat && (
            <div className="mobile-back-bar">
              <button className="backBtn" onClick={handleBack}>
                ⬅ Back
              </button>
              <p className="mobile-chat-title">{selectedChat.name}</p>
            </div>
          )}

          <ChatWindow
            selectedChat={selectedChat}
            onExitGroup={() => setSelectedChat(null)}
          />
        </div>
      )}

      {/* GROUP MODAL */}
      {showGroupModal && (
        <CreateGroupModal
          onClose={() => setShowGroupModal(false)}
          onCreate={handleCreateGroup}
        />
      )}
    </div>
  );
}
