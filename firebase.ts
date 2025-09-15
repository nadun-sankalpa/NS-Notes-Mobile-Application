// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDv0xTcEcCSgrQk9SIYEruWGm_E_sbaPG0",
  authDomain: "task-manager-af695.firebaseapp.com",
  projectId: "task-manager-af695",
  storageBucket: "task-manager-af695.firebasestorage.app",
  messagingSenderId: "314837570110",
  appId: "1:314837570110:web:47bc0d0f3760683a6bb76f",
  measurementId: "G-6VFK077X9R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app)
export const db = getFirestore(app)

