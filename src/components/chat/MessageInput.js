import React, { useState, useRef, useEffect } from "react";
import { sendMessage, setTypingStatus } from "../../firebase/chatService";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload";
import { useAuth } from "../../context/AuthContext";
import EmojiPicker from "emoji-picker-react";

export default function MessageInput({ chatId, replyMessage, setReplyMessage }) {
  const { currentUser } = useAuth();
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);

  const [showEmoji, setShowEmoji] = useState(false);
  const typingTimeoutRef = useRef(null);

  // auto focus when reply is set
  useEffect(() => {
    if (replyMessage) {
      setText("");
    }
  }, [replyMessage]);

  const handleSend = async () => {
    if (!text.trim()) return;

    try {
      await sendMessage(
        chatId,
        currentUser.uid,
        currentUser.name,
        text,
        "text",
        "",
        replyMessage
          ? {
              messageId: replyMessage.id,
              senderName: replyMessage.senderName,
              text: replyMessage.text,
              type: replyMessage.type,
            }
          : null
      );

      setText("");
      setShowEmoji(false);

      if (setReplyMessage) setReplyMessage(null);

      // stop typing after send
      await setTypingStatus(chatId, currentUser.uid, false);
    } catch (err) {
      console.log(err);
      alert("Message send failed!");
    }
  };

  const handleTyping = async (value) => {
    setText(value);

    // start typing
    await setTypingStatus(chatId, currentUser.uid, true);

    // stop typing after 2 sec of no typing
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(async () => {
      await setTypingStatus(chatId, currentUser.uid, false);
    }, 2000);
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
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
        url,
        replyMessage
          ? {
              messageId: replyMessage.id,
              senderName: replyMessage.senderName,
              text: replyMessage.text,
              type: replyMessage.type,
            }
          : null
      );

      if (setReplyMessage) setReplyMessage(null);

      alert("Uploaded Successfully!");
    } catch (err) {
      console.log(err);
      alert("Upload failed!");
    }

    setUploading(false);
  };

  return (
    <div style={styles.container}>
      {/* Reply Preview */}
      {replyMessage && (
        <div style={styles.replyBox}>
          <div style={styles.replyTextBox}>
            <p style={styles.replyTitle}>
              Replying to {replyMessage.senderName === currentUser.name ? "You" : replyMessage.senderName}
            </p>

            <p style={styles.replyMsg}>
              {replyMessage.type === "image"
                ? "📷 Photo"
                : replyMessage.type === "file"
                ? "📎 File"
                : replyMessage.text}
            </p>
          </div>

          <button
            style={styles.replyCloseBtn}
            onClick={() => setReplyMessage(null)}
          >
            ✖
          </button>
        </div>
      )}

      {/* Emoji Button */}
      <button
        style={styles.emojiBtn}
        onClick={() => setShowEmoji(!showEmoji)}
      >
        😀
      </button>

      {/* Emoji Picker */}
      {showEmoji && (
        <div style={styles.emojiPickerBox}>
          <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
        </div>
      )}

      {/* File Upload */}
      <label style={styles.fileBtn}>
        📎
        <input
          type="file"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
      </label>

      {/* Input */}
      <input
        style={styles.input}
        value={text}
        onChange={(e) => handleTyping(e.target.value)}
        placeholder="Type a message..."
        disabled={uploading}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSend();
        }}
      />

      {/* Send */}
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
    flexDirection: "column",
    padding: "10px",
    gap: "8px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    position: "relative",
  },

  replyBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255,255,255,0.1)",
    padding: "10px",
    borderRadius: "12px",
    borderLeft: "4px solid #22c55e",
  },

  replyTextBox: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  replyTitle: {
    margin: 0,
    color: "#22c55e",
    fontWeight: "bold",
    fontSize: "13px",
  },

  replyMsg: {
    margin: 0,
    color: "rgba(255,255,255,0.8)",
    fontSize: "13px",
  },

  replyCloseBtn: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  emojiBtn: {
    fontSize: "22px",
    cursor: "pointer",
    background: "rgba(255,255,255,0.1)",
    padding: "8px 12px",
    borderRadius: "12px",
    border: "none",
    color: "white",
    width: "fit-content",
  },

  emojiPickerBox: {
    position: "absolute",
    bottom: "90px",
    left: "10px",
    zIndex: 2000,
  },

  fileBtn: {
    fontSize: "22px",
    cursor: "pointer",
    background: "rgba(255,255,255,0.1)",
    padding: "8px 12px",
    borderRadius: "12px",
    color: "white",
    userSelect: "none",
    width: "fit-content",
  },

  input: {
    width: "100%",
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
    width: "fit-content",
    alignSelf: "flex-end",
  },
};
