// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDk8MGN6J11QzPXVCeQKbZcSAd7mMFjc5M",
  authDomain: "ns-notes-49af9.firebaseapp.com",
  projectId: "ns-notes-49af9",
  storageBucket: "ns-notes-49af9.firebasestorage.app",
  messagingSenderId: "426120624738",
  appId: "1:426120624738:web:be0907c7a3d791b2b0ef3b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and export it
export const db = getFirestore(app);

// Initialize Auth and export it
export const auth = getAuth(app);