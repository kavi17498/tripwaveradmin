// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC27I60Z-n9B9WQIiWT9lmgJshdLajW9BE",
  authDomain: "tripwaver-c64f5.firebaseapp.com",
  projectId: "tripwaver-c64f5",
  storageBucket: "tripwaver-c64f5.firebasestorage.app",
  messagingSenderId: "842160474291",
  appId: "1:842160474291:web:613beb0827f956fb6408c6"
};

// Initialize Firebase
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();