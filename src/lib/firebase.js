// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBkEfRtJerkowzW1UaAhExqZ5uwdGjjfvg",
    authDomain: "flow-by-z3connect.firebaseapp.com",
    projectId: "flow-by-z3connect",
    storageBucket: "flow-by-z3connect.firebasestorage.app",
    messagingSenderId: "609583240952",
    appId: "1:609583240952:web:f8c19128b237127f0b8d0d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, googleProvider, db, storage };
