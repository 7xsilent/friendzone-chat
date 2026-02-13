import React, { useEffect, useState, useRef } from "react";
import {
  listenMessages,
  getGroupDetails,
  exitGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  listenChatDetails,
  markMessagesAsSeen,
} from "../../firebase/chatService";

import { useAuth } from "../../context/AuthContext";
import MessageInput from "./MessageInput";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs, doc, onSnapshot } from "firebase/firestore";

export default function ChatWindow({
  selectedChat,
  onExitGroup,
  onBack,
  isMobile,
}) {
  const { currentUser } = useAuth();

  const [messages, setMessages] = useState([]);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [groupData, setGroupData] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState("");

  const [chatDetails, setChatDetails] = useState(null);
  const [friendOnline, setFriendOnline] = useState(false);

  const [replyMessage, setReplyMessage] = useState(null);

  const bottomRef = useRef(null);

  // swipe tracking
  const swipeStartX = useRef(0);

  // ✅ Load messages
  useEffect(() => {
    if (!selectedChat?.chatId) return;

    const unsub = listenMessages(selectedChat.chatId, (msgs) => {
      setMessages(msgs);
    });

    return () => unsub();
  }, [selectedChat]);

  // ✅ Listen chat details (typing + groupPhoto)
  useEffect(() => {
    if (!selectedChat?.chatId) return;

    const unsub = listenChatDetails(selectedChat.chatId, (data) => {
      setChatDetails(data);
    });

    return () => unsub();
  }, [selectedChat]);

  // ✅ Mark messages as seen when chat is opened
  useEffect(() => {
    if (!selectedChat?.chatId || !currentUser) return;

    markMessagesAsSeen(selectedChat.chatId, currentUser.uid);
  }, [selectedChat, currentUser]);

  // ✅ Auto Load Group Details
  useEffect(() => {
    const loadGroup = async () => {
      if (selectedChat?.isGroup && selectedChat?.chatId) {
        const data = await getGroupDetails(selectedChat.chatId);
        setGroupData(data);
      } else {
        setGroupData(null);
      }
    };

    loadGroup();
  }, [selectedChat]);

  // ✅ Auto Scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Friend Online / Offline listener
  useEffect(() => {
    if (!selectedChat || selectedChat.isGroup) return;
    if (!chatDetails?.members) return;

    const friendUid = chatDetails.members.find((m) => m !== currentUser.uid);
    if (!friendUid) return;

    const unsub = onSnapshot(doc(db, "users", friendUid), (snap) => {
      if (snap.exists()) {
        setFriendOnline(snap.data().online);
      }
    });

    return () => unsub();
  }, [selectedChat, chatDetails, currentUser]);

  const fetchAllUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    const users = snap.docs.map((doc) => doc.data());
    setAllUsers(users);
  };

  const handleOpenGroupInfo = async () => {
    if (!selectedChat?.chatId) return;

    const data = await getGroupDetails(selectedChat.chatId);
    setGroupData(data);
    setShowGroupInfo(true);

    await fetchAllUsers();
  };

  const handleExitGroup = async () => {
    if (!selectedChat?.chatId) return;

    const confirmExit = window.confirm(
      "Are you sure you want to exit this group?"
    );
    if (!confirmExit) return;

    await exitGroup(selectedChat.chatId, currentUser.uid);

    setShowGroupInfo(false);

    if (onExitGroup) {
      onExitGroup();
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserToAdd) return;

    const userToAdd = allUsers.find((u) => u.uid === selectedUserToAdd);
    if (!userToAdd) return;

    await addMemberToGroup(selectedChat.chatId, userToAdd);

    const updatedGroup = await getGroupDetails(selectedChat.chatId);
    setGroupData(updatedGroup);

    setSelectedUserToAdd("");
    alert("Member added successfully!");
  };

  const handleRemoveMember = async (uid) => {
    if (!groupData) return;

    const userToRemove = {
      uid,
      name: groupData.memberDetails?.[uid]?.name || "User",
    };

    const confirmRemove = window.confirm(
      `Remove ${userToRemove.name} from group?`
    );
    if (!confirmRemove) return;

    await removeMemberFromGroup(selectedChat.chatId, userToRemove);

    const updatedGroup = await getGroupDetails(selectedChat.chatId);
    setGroupData(updatedGroup);

    alert("Member removed!");
  };

  // ✅ Typing indicator
  const getTypingText = () => {
    if (!chatDetails?.typing) return "";

    if (selectedChat.isGroup) {
      const typingUsers = Object.keys(chatDetails.typing).filter(
        (uid) => chatDetails.typing[uid] === true && uid !== currentUser.uid
      );

      if (typingUsers.length === 0) return "";
      if (typingUsers.length === 1) {
        const name =
          groupData?.memberDetails?.[typingUsers[0]]?.name || "Someone";
        return `${name} is typing...`;
      }
      return "Multiple people are typing...";
    } else {
      const friendUid = chatDetails.members?.find((m) => m !== currentUser.uid);
      if (friendUid && chatDetails.typing[friendUid]) return "typing...";
    }

    return "";
  };

  // ✅ Seen tick logic
  const isMessageSeen = (msg) => {
    if (!msg.seenBy) return false;

    // PRIVATE CHAT
    if (!selectedChat.isGroup) {
      const friendUid = chatDetails?.members?.find((m) => m !== currentUser.uid);
      if (!friendUid) return false;

      return msg.seenBy.includes(friendUid);
    }

    // GROUP CHAT
    if (selectedChat.isGroup) {
      if (!groupData?.members) return false;

      return groupData.members.every((uid) => msg.seenBy.includes(uid));
    }

    return false;
  };

  // swipe reply handlers
  const handleTouchStart = (e) => {
    swipeStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (msg, e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - swipeStartX.current;

    if (diff > 80) {
      setReplyMessage(msg);
    }
  };

  // desktop drag reply (optional)
  const handleMouseDown = (e) => {
    swipeStartX.current = e.clientX;
  };

  const handleMouseUp = (msg, e) => {
    const diff = e.clientX - swipeStartX.current;

    if (diff > 120) {
      setReplyMessage(msg);
    }
  };

  if (!selectedChat) {
    return (
      <div style={styles.empty}>
        <h2 style={{ color: "white", opacity: 0.8 }}>
          Select a chat to start messaging
        </h2>
      </div>
    );
  }

  return (
    <div style={styles.chatWindow}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          {/* Mobile Back Button */}
          {isMobile && (
            <button style={styles.backBtn} onClick={onBack}>
              ⬅
            </button>
          )}

          {/* Avatar */}
          {selectedChat.isGroup ? (
            chatDetails?.groupPhoto ? (
              <img
                src={chatDetails.groupPhoto}
                alt="group"
                style={styles.headerAvatarImg}
              />
            ) : (
              <div style={styles.headerAvatar}>👥</div>
            )
          ) : selectedChat.photoURL ? (
            <img
              src={selectedChat.photoURL}
              alt="profile"
              style={styles.headerAvatarImg}
            />
          ) : (
            <div style={styles.headerAvatar}>
              {selectedChat.name?.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Name + Status */}
          <div>
            <h2 style={styles.headerTitle}>{selectedChat.name}</h2>

            {!selectedChat.isGroup && (
              <p style={styles.statusText}>
                <span
                  style={{
                    ...styles.onlineDot,
                    background: friendOnline ? "#22c55e" : "#ef4444",
                  }}
                ></span>

                {getTypingText()
                  ? getTypingText()
                  : friendOnline
                  ? "Online"
                  : "Offline"}
              </p>
            )}

            {selectedChat.isGroup && getTypingText() && (
              <p style={styles.statusText}>{getTypingText()}</p>
            )}
          </div>
        </div>

        {selectedChat.isGroup && (
          <button style={styles.infoBtn} onClick={handleOpenGroupInfo}>
            ℹ️ Info
          </button>
        )}
      </div>

      {/* MESSAGES */}
      <div style={styles.messages}>
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.uid;

          const senderPhoto =
            groupData?.memberDetails?.[msg.senderId]?.photoURL || "";

          const senderName =
            msg.senderId === "system"
              ? "System"
              : isMe
              ? "You"
              : msg.senderName || "Unknown";

          const seen = isMessageSeen(msg);

          return (
            <div
              key={msg.id}
              style={{
                ...styles.messageRow,
                justifyContent: isMe ? "flex-end" : "flex-start",
              }}
            >
              {/* GROUP sender avatar */}
              {selectedChat.isGroup && !isMe && msg.senderId !== "system" && (
                <>
                  {senderPhoto ? (
                    <img
                      src={senderPhoto}
                      alt="profile"
                      style={styles.msgAvatarImg}
                    />
                  ) : (
                    <div style={styles.msgAvatarText}>
                      {senderName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </>
              )}

              <div
                style={{
                  ...styles.messageBubble,
                  ...(isMe ? styles.myBubble : styles.otherBubble),
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={(e) => handleTouchEnd(msg, e)}
                onMouseDown={handleMouseDown}
                onMouseUp={(e) => handleMouseUp(msg, e)}
              >
                {/* Sender Name in Group */}
                {selectedChat.isGroup && (
                  <p
                    style={{
                      ...styles.senderName,
                      color: isMe ? "#dbeafe" : "#22c55e",
                    }}
                  >
                    {senderName}
                  </p>
                )}

                {/* Reply Box inside bubble */}
                {msg.replyTo && (
                  <div style={styles.replyInside}>
                    <p style={styles.replyInsideTitle}>
                      {msg.replyTo.senderName || "Someone"}
                    </p>
                    <p style={styles.replyInsideText}>
                      {msg.replyTo.type === "image"
                        ? "📷 Photo"
                        : msg.replyTo.type === "file"
                        ? "📎 File"
                        : msg.replyTo.text}
                    </p>
                  </div>
                )}

                {msg.type === "text" && <p style={styles.text}>{msg.text}</p>}

                {msg.type === "image" && (
                  <img
                    src={msg.attachment}
                    alt="sent"
                    style={styles.image}
                    onClick={() => setFullscreenImage(msg.attachment)}
                  />
                )}

                {msg.type === "file" && (
                  <a
                    href={msg.attachment}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.fileLink}
                  >
                    📎 Open / Download File
                  </a>
                )}

                {/* time + tick */}
                <div style={styles.bottomRow}>
                  <p style={styles.time}>
                    {msg.createdAt?.seconds
                      ? new Date(
                          msg.createdAt.seconds * 1000
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </p>

                  {isMe && msg.senderId !== "system" && (
                    <p style={styles.tick}>{seen ? "✔✔" : "✔"}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef}></div>
      </div>

      {/* INPUT */}
      <div style={styles.inputWrapper}>
        <MessageInput
          chatId={selectedChat.chatId}
          replyMessage={replyMessage}
          setReplyMessage={setReplyMessage}
        />
      </div>

      {/* FULLSCREEN IMAGE */}
      {fullscreenImage && (
        <div
          style={styles.fullscreenOverlay}
          onClick={() => setFullscreenImage(null)}
        >
          <div
            style={styles.fullscreenContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={styles.closeBtn}
              onClick={() => setFullscreenImage(null)}
            >
              ✖
            </button>
            <img
              src={fullscreenImage}
              alt="full"
              style={styles.fullscreenImage}
            />
          </div>
        </div>
      )}

      {/* GROUP INFO MODAL */}
      {showGroupInfo && groupData && (
        <div style={styles.modalOverlay} onClick={() => setShowGroupInfo(false)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: "white", marginBottom: "10px" }}>
              👥 {groupData.groupName}
            </h2>

            <p style={{ color: "rgba(255,255,255,0.7)" }}>
              Members: <b>{groupData.members.length}</b>
            </p>

            <div style={styles.memberList}>
              {groupData.members.map((m) => {
                const memberName = groupData.memberDetails?.[m]?.name || m;
                const memberPhoto = groupData.memberDetails?.[m]?.photoURL || "";

                return (
                  <div key={m} style={styles.memberRow}>
                    <div style={styles.memberProfile}>
                      {memberPhoto ? (
                        <img
                          src={memberPhoto}
                          alt="profile"
                          style={styles.memberAvatar}
                        />
                      ) : (
                        <div style={styles.memberAvatarText}>
                          {memberName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <p style={styles.memberItem}>{memberName}</p>
                    </div>

                    {groupData.admin === currentUser.uid &&
                      m !== currentUser.uid && (
                        <button
                          style={styles.removeBtn}
                          onClick={() => handleRemoveMember(m)}
                        >
                          ❌
                        </button>
                      )}
                  </div>
                );
              })}
            </div>

            {groupData.admin === currentUser.uid && (
              <>
                <h3 style={{ color: "white", marginTop: "15px" }}>
                  Add Member
                </h3>

                <select
                  style={styles.select}
                  value={selectedUserToAdd}
                  onChange={(e) => setSelectedUserToAdd(e.target.value)}
                >
                  <option value="">Select user</option>

                  {allUsers
                    .filter(
                      (u) =>
                        u.uid !== currentUser.uid &&
                        !groupData.members.includes(u.uid)
                    )
                    .map((u) => (
                      <option key={u.uid} value={u.uid}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                </select>

                <button style={styles.addBtn} onClick={handleAddMember}>
                  ➕ Add Member
                </button>
              </>
            )}

            <button style={styles.exitBtn} onClick={handleExitGroup}>
              🚪 Exit Group
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  chatWindow: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    background: "rgba(0,0,0,0.12)",
  },

  header: {
    padding: "14px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(8px)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  backBtn: {
    background: "rgba(255,255,255,0.12)",
    border: "none",
    color: "white",
    fontSize: "18px",
    padding: "8px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  headerAvatar: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.12)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    fontWeight: "bold",
    fontSize: "18px",
  },

  headerAvatarImg: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(59,130,246,0.7)",
  },

  headerTitle: {
    margin: 0,
    color: "white",
    fontSize: "18px",
    fontWeight: "800",
  },

  statusText: {
    margin: 0,
    fontSize: "12px",
    color: "rgba(255,255,255,0.7)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  onlineDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
  },

  infoBtn: {
    background: "#3b82f6",
    border: "none",
    padding: "8px 12px",
    borderRadius: "10px",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },

  messages: {
    flex: 1,
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    overflowY: "auto",
  },

  messageRow: {
    display: "flex",
    width: "100%",
    gap: "10px",
    alignItems: "flex-end",
  },

  msgAvatarImg: {
    width: "35px",
    height: "35px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(34,197,94,0.7)",
  },

  msgAvatarText: {
    width: "35px",
    height: "35px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.12)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    fontWeight: "bold",
    fontSize: "14px",
  },

  messageBubble: {
    maxWidth: "70%",
    padding: "12px 14px",
    borderRadius: "16px",
    color: "white",
    fontSize: "15px",
    wordBreak: "break-word",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.4)",
  },

  myBubble: {
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    borderBottomRightRadius: "6px",
  },

  otherBubble: {
    background: "rgba(255,255,255,0.12)",
    borderBottomLeftRadius: "6px",
  },

  senderName: {
    fontSize: "12px",
    fontWeight: "bold",
    margin: "0 0 6px 0",
  },

  replyInside: {
    background: "rgba(0,0,0,0.25)",
    borderLeft: "4px solid #22c55e",
    padding: "6px 10px",
    borderRadius: "10px",
    marginBottom: "6px",
  },

  replyInsideTitle: {
    margin: 0,
    fontSize: "12px",
    fontWeight: "bold",
    color: "#22c55e",
  },

  replyInsideText: {
    margin: 0,
    fontSize: "12px",
    color: "rgba(255,255,255,0.8)",
  },

  text: {
    margin: 0,
    lineHeight: "1.4",
  },

  image: {
    width: "100%",
    maxWidth: "280px",
    borderRadius: "12px",
    marginTop: "5px",
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.2)",
  },

  fileLink: {
    display: "inline-block",
    marginTop: "6px",
    padding: "8px 12px",
    borderRadius: "10px",
    background: "rgba(0,0,0,0.25)",
    color: "#22c55e",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "14px",
  },

  bottomRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "6px",
    gap: "10px",
  },

  time: {
    fontSize: "11px",
    margin: 0,
    color: "rgba(255,255,255,0.65)",
  },

  tick: {
    margin: 0,
    fontSize: "12px",
    color: "rgba(255,255,255,0.9)",
    fontWeight: "bold",
  },

  inputWrapper: {
    padding: "0px",
  },

  empty: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },

  modalBox: {
    width: "400px",
    background: "rgba(20,20,20,0.95)",
    padding: "20px",
    borderRadius: "16px",
    boxShadow: "0px 10px 30px rgba(0,0,0,0.6)",
  },

  memberList: {
    marginTop: "15px",
    maxHeight: "160px",
    overflowY: "auto",
    padding: "10px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "12px",
  },

  memberRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },

  memberProfile: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  memberAvatar: {
    width: "35px",
    height: "35px",
    borderRadius: "50%",
    objectFit: "cover",
  },

  memberAvatarText: {
    width: "35px",
    height: "35px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.12)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    fontWeight: "bold",
  },

  memberItem: {
    color: "white",
    fontSize: "14px",
    margin: 0,
    opacity: 0.9,
  },

  removeBtn: {
    background: "#ef4444",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    padding: "6px 10px",
    color: "white",
  },

  select: {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    borderRadius: "10px",
    border: "none",
    outline: "none",
    background: "rgba(255,255,255,0.1)",
    color: "white",
  },

  addBtn: {
    width: "100%",
    marginTop: "10px",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    background: "#22c55e",
    color: "white",
  },

  exitBtn: {
    width: "100%",
    marginTop: "12px",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    background: "#ef4444",
    color: "white",
  },

  fullscreenOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },

  fullscreenContent: {
    position: "relative",
    maxWidth: "90%",
    maxHeight: "90%",
  },

  fullscreenImage: {
    width: "100%",
    maxHeight: "90vh",
    borderRadius: "12px",
  },

  closeBtn: {
    position: "absolute",
    top: "-10px",
    right: "-10px",
    background: "#ef4444",
    border: "none",
    borderRadius: "50%",
    color: "white",
    width: "35px",
    height: "35px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
