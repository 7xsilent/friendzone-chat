import React, { useEffect, useState } from "react";
import { db } from "../../firebase/firebaseConfig";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

export default function RecentChatsSidebar({ onSelectChat }) {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [search, setSearch] = useState("");
  const [activeChatId, setActiveChatId] = useState(null);

  // ✅ Load all users with photoURL + online status
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const map = {};
      snapshot.docs.forEach((doc) => {
        map[doc.data().uid] = doc.data();
      });
      setUsersMap(map);
    });

    return () => unsub();
  }, []);

  // ✅ Load chats
  useEffect(() => {
    if (!currentUser) return;

    const chatsRef = collection(db, "chats");

    const q = query(
      chatsRef,
      where("members", "array-contains", currentUser.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const allChats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      allChats.sort((a, b) => {
        const timeA = a.lastMessageTime?.seconds || 0;
        const timeB = b.lastMessageTime?.seconds || 0;
        return timeB - timeA;
      });

      setChats(allChats);
    });

    return () => unsub();
  }, [currentUser]);

  const getChatTitle = (chat) => {
    if (chat.isGroup) return chat.groupName || "Group";

    const otherUserId = chat.members.find((uid) => uid !== currentUser.uid);

    return usersMap[otherUserId]?.name || "User";
  };

  const getOtherUserPhoto = (chat) => {
    if (chat.isGroup) return "";

    const otherUserId = chat.members.find((uid) => uid !== currentUser.uid);

    return usersMap[otherUserId]?.photoURL || "";
  };

  const getOtherUserOnlineStatus = (chat) => {
    if (chat.isGroup) return false;

    const otherUserId = chat.members.find((uid) => uid !== currentUser.uid);

    return usersMap[otherUserId]?.online || false;
  };

  const getAvatarText = (chatTitle) => {
    if (!chatTitle) return "?";
    return chatTitle.charAt(0).toUpperCase();
  };

  const getTimeText = (timestamp) => {
    if (!timestamp?.seconds) return "";

    const date = new Date(timestamp.seconds * 1000);
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHour = hours % 12 || 12;

    return `${formattedHour}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  const filteredChats = chats.filter((chat) => {
    const chatTitle = getChatTitle(chat);
    return chatTitle.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Chats</h2>
        <p style={styles.subtitle}>Your recent conversations</p>
      </div>

      {/* Search */}
      <div style={styles.searchBox}>
        <input
          style={styles.searchInput}
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Chat List */}
      <div style={styles.chatList}>
        {filteredChats.length === 0 && (
          <p style={styles.emptyText}>No chats found</p>
        )}

        {filteredChats.map((chat) => {
          const chatTitle = getChatTitle(chat);
          const avatarText = getAvatarText(chatTitle);

          const lastMessage =
            chat.lastMessage && chat.lastMessage.length > 0
              ? chat.lastMessage
              : "No messages yet";

          const timeText = getTimeText(chat.lastMessageTime);

          const isActive = activeChatId === chat.chatId;

          const photoURL = getOtherUserPhoto(chat);
          const isOnline = getOtherUserOnlineStatus(chat);

          return (
            <div
              key={chat.chatId}
              style={{
                ...styles.chatCard,
                ...(isActive ? styles.activeChatCard : {}),
              }}
              onClick={() => {
                setActiveChatId(chat.chatId);

                onSelectChat({
                  chatId: chat.chatId,
                  isGroup: chat.isGroup,
                  name: chatTitle,
                  photoURL: photoURL,
                });
              }}
            >
              {/* Avatar + Online Dot */}
              <div style={styles.avatarWrapper}>
                {chat.isGroup ? (
                  <div style={styles.groupAvatar}>👥</div>
                ) : photoURL ? (
                  <img src={photoURL} alt="profile" style={styles.avatarImg} />
                ) : (
                  <div style={styles.avatarText}>{avatarText}</div>
                )}

                {/* Online Offline Dot */}
                {!chat.isGroup && (
                  <span
                    style={{
                      ...styles.statusDot,
                      background: isOnline ? "#22c55e" : "#ef4444",
                    }}
                  ></span>
                )}
              </div>

              {/* Chat Info */}
              <div style={styles.chatInfo}>
                <div style={styles.chatTopRow}>
                  <p style={styles.chatName}>{chatTitle}</p>
                  <p style={styles.time}>{timeText}</p>
                </div>

                <p style={styles.lastMessage}>{lastMessage}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "15px",
    overflow: "hidden",
  },

  header: {
    marginBottom: "15px",
  },

  title: {
    margin: 0,
    color: "white",
    fontSize: "24px",
    fontWeight: "800",
  },

  subtitle: {
    margin: "5px 0 0 0",
    fontSize: "13px",
    color: "rgba(255,255,255,0.6)",
  },

  searchBox: {
    marginBottom: "15px",
  },

  searchInput: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.15)",
    outline: "none",
    fontSize: "14px",
    background: "rgba(255,255,255,0.08)",
    color: "white",
  },

  chatList: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    paddingRight: "5px",
  },

  emptyText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: "14px",
    textAlign: "center",
    marginTop: "20px",
  },

  chatCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    borderRadius: "14px",
    cursor: "pointer",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    transition: "0.3s ease",
  },

  activeChatCard: {
    background: "rgba(59,130,246,0.25)",
    border: "1px solid rgba(59,130,246,0.6)",
  },

  avatarWrapper: {
    position: "relative",
    flexShrink: 0,
  },

  statusDot: {
    position: "absolute",
    bottom: "2px",
    right: "2px",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    border: "2px solid #0f172a",
  },

  avatarImg: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(59,130,246,0.8)",
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
  },

  groupAvatar: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.1)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "22px",
  },

  chatInfo: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  chatTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },

  chatName: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "700",
    color: "white",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  time: {
    margin: 0,
    fontSize: "11px",
    color: "rgba(255,255,255,0.55)",
    whiteSpace: "nowrap",
  },

  lastMessage: {
    margin: 0,
    fontSize: "13px",
    color: "rgba(255,255,255,0.65)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
};
