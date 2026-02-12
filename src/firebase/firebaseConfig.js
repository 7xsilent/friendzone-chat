import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAjwBlXdB7slBMfFhoaAL72WcgCwUILWFM",
  authDomain: "friendzonechat-7fdac.firebaseapp.com",
  projectId: "friendzonechat-7fdac",
  storageBucket: "friendzonechat-7fdac.firebasestorage.app",
  messagingSenderId: "1006766075276",
  appId: "1:1006766075276:web:4302092f5bad4c64637aa9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

