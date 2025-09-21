// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCywYqJV2_vwpzMExtUdb_EjF1Wl_mT-qM",
  authDomain: "ns-notes-c4058.firebaseapp.com",
  projectId: "ns-notes-c4058",
  storageBucket: "ns-notes-c4058.firebasestorage.app",
  messagingSenderId: "936703816440",
  appId: "1:936703816440:web:d37c10bb5001e3ac03c10d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Restore Firestore and Auth exports
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);