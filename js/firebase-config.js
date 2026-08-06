// ==========================================
// SERVORA FIREBASE CONFIG
// Realtime Database Version
// ==========================================

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getDatabase
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {

    apiKey: "AIzaSyCtwiwNMM_41v5C69a-wZK2lH7IDE9UWAw",
  authDomain: "servora-4f441.firebaseapp.com",
  databaseURL: "https://servora-4f441-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "servora-4f441",
  storageBucket: "servora-4f441.firebasestorage.app",
  messagingSenderId: "127789823874",
  appId: "1:127789823874:web:a487031d5d7337e8ba419b"

};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);

export {

    auth,

    db

};