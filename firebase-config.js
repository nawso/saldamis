import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBY74WvWBN3taHZ2U8s-KLbZ8t3o7mPjlw",
  authDomain: "saldamis.firebaseapp.com",
  projectId: "saldamis",
  storageBucket: "saldamis.firebasestorage.app",
  messagingSenderId: "960732616510",
  appId: "1:960732616510:web:78bca06f0063075d3dfe6f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth, collection, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, doc, onSnapshot, signInWithEmailAndPassword, onAuthStateChanged, signOut };
