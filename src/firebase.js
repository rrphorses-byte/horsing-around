import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBWUmkehUlQ70w3h219Dg92eeHdDjfWMMQ",
  authDomain: "horsing-around-70354.firebaseapp.com",
  projectId: "horsing-around-70354",
  storageBucket: "horsing-around-70354.firebasestorage.app",
  messagingSenderId: "175458919055",
  appId: "1:175458919055:web:a7d5e8685124f8ad91c6fa"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
