
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDP55rYzepvZO_uqmvkGFQIEoENJRtxZeM",
  authDomain: "csaefloripa.firebaseapp.com",
  projectId: "csaefloripa",
  storageBucket: "csaefloripa.appspot.com",
  messagingSenderId: "906236888423",
  appId: "1:906236888423:web:45e50392a83ca3333a9bc2",
  measurementId: "G-BQDMRCR89V"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
