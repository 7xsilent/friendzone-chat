import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "./firebaseConfig";

// Register
export const registerUser = async (name, email, password) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    name,
    email,
    photoURL: "",
    createdAt: serverTimestamp(),
    online: true,
    lastSeen: serverTimestamp(),   // ✅ NEW
  });

  return user;
};

// Login
export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  await updateDoc(doc(db, "users", user.uid), {
    online: true,
    lastSeen: serverTimestamp(),   // ✅ NEW
  });

  return user;
};

// Logout
export const logoutUser = async (uid) => {
  if (uid) {
    await updateDoc(doc(db, "users", uid), {
      online: false,
      lastSeen: serverTimestamp(),   // ✅ NEW
    });
  }

  await signOut(auth);
};
