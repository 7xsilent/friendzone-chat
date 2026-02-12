import React, { useEffect, useState } from "react";
import { sendMessage, setTypingStatus } from "../../firebase/chatService";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload";
import { useAuth } from "../../context/AuthContext";

export default function MessageInput({ chatId }) {
  const { currentUser } = useAuth();
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);

  // ✅ typing timeout
  useEffect(() => {
    if (!chatId || !currentUser) return;

    const timeout = setTimeout(() => {
      if (text.trim().length > 0) {
        setTypingStatus(chatId, currentUser.uid, true);
      } else {
        setTypingStatus(chatId, currentUser.uid, false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [text, chatId, currentUser]);

  // ✅ stop typing when unmount
  useEffect(() => {
    return () => {
      if (chatId && currentUser?.uid) {
        setTypingStatus(chatId, currentUser.uid, false);
      }
    };
  }, [chatId, currentUser]);

  const handleSend = async () => {
    if (!text.trim()) return;

    try {
      await sendMessage(
        chatId,
        currentUser.uid,
        currentUser.name,
        text,
        "text",
        ""
      );

      setText("");
      await setTypingStatus(chatId, currentUser.uid, false);
    } catch (err) {
      console.log(err);
      alert("Message send failed!");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const url = await uploadToCloudinary(file);

      const isImage = file.type.startsWith("image/");
      const msgType = isImage ? "image" : "file";

      await sendMessage(
        chatId,
        currentUser.uid,
        currentUser.name,
        isImage ? "📷 Photo" : `📎 ${file.name}`,
        msgType,
        url
      );

      alert("Uploaded Successfully!");
    } catch (err) {
      console.log(err);
      alert("Upload failed!");
    }

    setUploading(false);
  };

  return (
    <div style={styles.container}>
      <label style={styles.fileBtn}>
        📎
        <input
          type="file"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
      </label>

      <input
        style={styles.input}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        disabled={uploading}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSend();
        }}
      />

      <button
        style={{
          ...styles.sendBtn,
          background: uploading ? "#64748b" : "#22c55e",
        }}
        onClick={handleSend}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Send"}
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    padding: "12px",
    gap: "10px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
  },
  fileBtn: {
    fontSize: "22px",
    cursor: "pointer",
    background: "rgba(255,255,255,0.1)",
    padding: "8px 12px",
    borderRadius: "12px",
    color: "white",
    userSelect: "none",
  },
  input: {
    flex: 1,
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    outline: "none",
    fontSize: "15px",
  },
  sendBtn: {
    padding: "12px 18px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    color: "white",
  },
};
