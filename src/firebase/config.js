import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBZgtnCE6EYRn2AUZAshozkmTa0jCQUMJ0",
  authDomain: "hydrotrack-a91e4.firebaseapp.com",
  databaseURL: "https://hydrotrack-a91e4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "hydrotrack-a91e4",
  storageBucket: "hydrotrack-a91e4.firebasestorage.app",
  messagingSenderId: "773690673107",
  appId: "1:773690673107:web:40db0f9fede912b5611126",
  measurementId: "G-YMXKMJM24M"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);