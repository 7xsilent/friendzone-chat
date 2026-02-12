import { db } from "./firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

export const testFirestore = async () => {
  try {
    await addDoc(collection(db, "test"), {
      message: "Firebase is connected successfully!",
      createdAt: new Date(),
    });
    console.log("✅ Firestore Connected Successfully!");
  } catch (err) {
    console.log("❌ Firestore Error:", err);
  }
};
