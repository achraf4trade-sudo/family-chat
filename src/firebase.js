import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAAnvzZf-vZ2P79C6_V6gqok9A77bASbzU",
  authDomain: "family-chat-b54fb.firebaseapp.com",
  projectId: "family-chat-b54fb",
  storageBucket: "family-chat-b54fb.firebasestorage.app",
  messagingSenderId: "84250523946",
  appId: "1:84250523946:web:819146dade6232fc480653",
  measurementId: "G-C80JKVLB9B"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);