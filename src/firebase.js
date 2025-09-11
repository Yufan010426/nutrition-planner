// src/firebase.js
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyAyfm-lzkp9TOIKK-A_Z9CtDnXTlA-JlcY",
  authDomain: "yufanliu0426.firebaseapp.com",
  projectId: "yufanliu0426",
  storageBucket: "yufanliu0426.firebasestorage.app",
  messagingSenderId: "35450987849",
  appId: "1:35450987849:web:a870b04154de8e945ee698",
  measurementId: "G-2ZQMBJPCK7"
};

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
