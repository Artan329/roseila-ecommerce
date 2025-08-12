// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { getFirestore, collection, getDocs, addDoc, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


const firebaseConfig = {
  apiKey: "AIzaSyC9ZJrRgj5nhZpazMVotYLa0slXDGUb3GM",
  authDomain: "roseila-e-commerce.firebaseapp.com",
  projectId: "roseila-e-commerce",
  storageBucket: "roseila-e-commerce.firebasestorage.app",
  messagingSenderId: "888811369141",
  appId: "1:888811369141:web:d5fe08217785cf227bc4fc",
  measurementId: "G-2GQ171P1SK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export { signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup };

// Helper functions
export const createUserDocument = async (user, additionalData) => {
  if (!user) return;
  
  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);
  
  if (!snapshot.exists()) {
    const { email, displayName } = user;
    const createdAt = new Date();
    
    try {
      await setDoc(userRef, {
        displayName,
        email,
        createdAt,
        ...additionalData
      });
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  }
  
  return userRef;
};

// Export auth state listener
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};
