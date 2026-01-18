// Firebase initialization helper
// This file ensures Firebase is properly initialized before services are accessed

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyAfR51brr6nhQcxoVAkGQsbo0ZHPzEpsUU",
    authDomain: "boundless-d2a20.firebaseapp.com",
    projectId: "boundless-d2a20",
    storageBucket: "boundless-d2a20.firebasestorage.app",
    messagingSenderId: "138504465804",
    appId: "1:138504465804:web:67b2f177e3d92c87ab3aa9",
    measurementId: "G-PS6RKY49FB"
};

// Initialize app
const app: FirebaseApp = getApps().length === 0 
    ? initializeApp(firebaseConfig)
    : getApps()[0];

// Initialize services with retry logic
function initAuth(): Auth {
    try {
        return getAuth(app);
    } catch (error: any) {
        console.error("Auth init error:", error);
        throw error;
    }
}

function initFirestore(): Firestore {
    try {
        return getFirestore(app);
    } catch (error: any) {
        console.error("Firestore init error:", error);
        throw error;
    }
}

function initFunctions(): Functions {
    try {
        return getFunctions(app);
    } catch (error: any) {
        console.error("Functions init error:", error);
        throw error;
    }
}

// Export initialized services
export const auth = initAuth();
export const db = initFirestore();
export const functions = initFunctions();

