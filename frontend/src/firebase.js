// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDRIA646-JmWH46Q4lRWSKe6pnZ0TJQtE4",
  authDomain: "checky-1a98c.firebaseapp.com",
  projectId: "checky-1a98c",
  storageBucket: "checky-1a98c.firebasestorage.app",
  messagingSenderId: "968835021693",
  appId: "1:968835021693:web:cc3a01e80d99fc3c2f2a14",
  measurementId: "G-CCQKTVV3MZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();