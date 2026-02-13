import { db } from "./firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  arrayRemove,
  arrayUnion,
  getDocs,
} from "firebase/firestore";

// Create Private Chat if not exists
export const createChatIfNotExists = async (chatId, members, memberDetails) => {
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      chatId,
      members,
      memberDetails,
      isGroup: false,
      lastMessage: "",
      lastMessageTime: serverTimestamp(),
      createdAt: serverTimestamp(),

      // typing + lastSeen
      typing: {},
      lastSeen: {},
    });
  }
};

// Create Group Chat
export const createGroupChat = async (
  groupName,
  members,
  adminId,
  memberDetails
) => {
  const chatId = "group_" + Date.now();
  const chatRef = doc(db, "chats", chatId);

  await setDoc(chatRef, {
    chatId,
    isGroup: true,
    groupName,
    groupPhoto: "",
    members,
    memberDetails: memberDetails || {},
    admin: adminId,
    lastMessage: "Group created",
    lastMessageTime: serverTimestamp(),
    createdAt: serverTimestamp(),

    typing: {},
    lastSeen: {},
  });

  return chatId;
};

// ✅ Send Message (UPDATED WITH REPLY FEATURE)
export const sendMessage = async (
  chatId,
  senderId,
  senderName,
  text,
  type = "text",
  attachment = "",
  replyTo = null
) => {
  const msgRef = collection(db, "messages", chatId, "chatMessages");

  await addDoc(msgRef, {
    senderId,
    senderName,
    text,
    type,
    attachment,
    createdAt: serverTimestamp(),

    // seen support
    seenBy: [senderId],

    // ✅ Reply Feature Support
    replyTo: replyTo || null,
  });

  const lastMsgPreview =
    type === "text"
      ? text
      : type === "image"
      ? "📷 Photo"
      : type === "file"
      ? "📎 File"
      : text;

  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: lastMsgPreview,
    lastMessageTime: serverTimestamp(),
  });
};

// Listen Messages
export const listenMessages = (chatId, callback) => {
  const msgRef = collection(db, "messages", chatId, "chatMessages");
  const q = query(msgRef, orderBy("createdAt", "asc"));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(messages);
  });
};

// Get Group Details
export const getGroupDetails = async (chatId) => {
  const chatRef = doc(db, "chats", chatId);
  const snap = await getDoc(chatRef);

  if (!snap.exists()) return null;
  return snap.data();
};

// Exit Group
export const exitGroup = async (chatId, userId) => {
  const chatRef = doc(db, "chats", chatId);

  await updateDoc(chatRef, {
    members: arrayRemove(userId),
  });

  const msgRef = collection(db, "messages", chatId, "chatMessages");
  await addDoc(msgRef, {
    senderId: "system",
    senderName: "System",
    text: "A user left the group",
    type: "text",
    attachment: "",
    createdAt: serverTimestamp(),
    seenBy: [],
    replyTo: null,
  });
};

// Add Member to Group
export const addMemberToGroup = async (chatId, user) => {
  const chatRef = doc(db, "chats", chatId);

  await updateDoc(chatRef, {
    members: arrayUnion(user.uid),
    [`memberDetails.${user.uid}`]: {
      name: user.name,
      email: user.email,
      photoURL: user.photoURL || "",
    },
  });

  const msgRef = collection(db, "messages", chatId, "chatMessages");
  await addDoc(msgRef, {
    senderId: "system",
    senderName: "System",
    text: `${user.name} added to group`,
    type: "text",
    attachment: "",
    createdAt: serverTimestamp(),
    seenBy: [],
    replyTo: null,
  });
};

// Remove Member from Group
export const removeMemberFromGroup = async (chatId, user) => {
  const chatRef = doc(db, "chats", chatId);

  await updateDoc(chatRef, {
    members: arrayRemove(user.uid),
  });

  const msgRef = collection(db, "messages", chatId, "chatMessages");
  await addDoc(msgRef, {
    senderId: "system",
    senderName: "System",
    text: `${user.name} removed from group`,
    type: "text",
    attachment: "",
    createdAt: serverTimestamp(),
    seenBy: [],
    replyTo: null,
  });
};

// Mark messages as seen
export const markMessagesAsSeen = async (chatId, uid) => {
  const msgRef = collection(db, "messages", chatId, "chatMessages");
  const snap = await getDocs(msgRef);

  snap.docs.forEach(async (d) => {
    const data = d.data();

    if (!data.seenBy || !data.seenBy.includes(uid)) {
      await updateDoc(doc(db, "messages", chatId, "chatMessages", d.id), {
        seenBy: arrayUnion(uid),
      });
    }
  });
};

// Typing status update
export const setTypingStatus = async (chatId, uid, isTyping) => {
  const chatRef = doc(db, "chats", chatId);

  await updateDoc(chatRef, {
    [`typing.${uid}`]: isTyping,
  });
};

// Listen chat document for typing
export const listenChatDetails = (chatId, callback) => {
  const chatRef = doc(db, "chats", chatId);

  return onSnapshot(chatRef, (snap) => {
    if (snap.exists()) callback(snap.data());
  });
};
