import React from "react";

export default function MessageBubble({ message, isMine, isGroup }) {
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isMine ? "flex-end" : "flex-start",
        marginBottom: "12px",
      }}
    >
      <div
        style={{
          padding: "10px 15px",
          borderRadius: "15px",
          maxWidth: "60%",
          background: isMine ? "#3b82f6" : "rgba(255,255,255,0.15)",
          color: "white",
          overflowWrap: "break-word",
        }}
      >
        {/* GROUP CHAT: show sender name */}
        {isGroup && !isMine && (
          <p style={{ margin: 0, fontSize: "12px", opacity: 0.7 }}>
            {message.senderName ? message.senderName : "Unknown"}
          </p>
        )}

        {/* TEXT MESSAGE */}
        {message.type === "text" && <p style={{ margin: 0 }}>{message.text}</p>}

        {/* IMAGE MESSAGE */}
        {message.type === "image" && (
          <div>
            <img
              src={message.attachment}
              alt="attachment"
              style={{
                width: "220px",
                borderRadius: "12px",
                marginBottom: "5px",
              }}
            />
            {message.text && <p style={{ margin: 0 }}>{message.text}</p>}
          </div>
        )}

        {/* FILE MESSAGE */}
        {message.type === "file" && (
          <div>
            <a
              href={message.attachment}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "white",
                fontWeight: "bold",
                textDecoration: "underline",
              }}
            >
              📎 Open File
            </a>
            {message.text && <p style={{ marginTop: "5px" }}>{message.text}</p>}
          </div>
        )}

        {/* TIME */}
        <p
          style={{
            margin: 0,
            marginTop: "6px",
            fontSize: "11px",
            opacity: 0.7,
            textAlign: "right",
          }}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
