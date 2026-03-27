/* ============================================================
   firebase.js – Mines & Monarch · Inicialización Firebase
   ============================================================ */

import { initializeApp }            from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore,
         doc, getDoc, setDoc,
         collection, addDoc,
         getDocs, updateDoc,
         runTransaction }           from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getAuth,
         createUserWithEmailAndPassword,
         signInWithEmailAndPassword,
         signOut,
         onAuthStateChanged }       from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

/* ── Reemplaza estos valores con los de tu proyecto ── */
const firebaseConfig = {
    apiKey:            "TU_API_KEY",
    authDomain:        "TU_PROYECTO.firebaseapp.com",
    projectId:         "TU_PROYECTO",
    storageBucket:     "TU_PROYECTO.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId:             "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const auth = getAuth(app);

export {
    db, auth,
    doc, getDoc, setDoc,
    collection, addDoc, getDocs, updateDoc,
    runTransaction,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
};
