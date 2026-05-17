import { initializeApp } from "firebase/app";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";

import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBZgtnCE6EYRn2AUZAshozkmTa0jCQUMJ0",
  authDomain: "hydrotrack-a91e4.firebaseapp.com",
  databaseURL:
    "https://hydrotrack-a91e4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "hydrotrack-a91e4",
  storageBucket: "hydrotrack-a91e4.firebasestorage.app",
  messagingSenderId: "773690673107",
  appId: "1:773690673107:web:40db0f9fede912b5611126",
  measurementId: "G-YMXKMJM24M",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const realtimeDb = getDatabase(app);

export const signupUser = async (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const loginUser = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const resetUserPassword = async (email) => {
  return sendPasswordResetEmail(auth, email);
};

export const logoutUser = async () => {
  return signOut(auth);
};