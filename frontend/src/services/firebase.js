import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";

// Environment-driven Firebase Configuration (Vite)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Check if valid Firebase configuration is provided
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.trim() !== "" &&
  firebaseConfig.authDomain &&
  firebaseConfig.authDomain.trim() !== ""
);

let app = null;
let auth = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
  } catch (err) {
    console.error("Firebase initialization failed:", err);
  }
}

/**
 * Sign in using Google OAuth Popup via Firebase Authentication
 */
export async function signInWithGoogle() {
  if (!isFirebaseConfigured || !auth) {
    throw new Error(
      "Firebase Authentication is not configured. Please set VITE_FIREBASE_API_KEY and VITE_FIREBASE_AUTH_DOMAIN in your environment variables and enable Google Provider in Firebase Console."
    );
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return {
      uid: user.uid,
      name: user.displayName || "Google User",
      email: user.email,
      photoURL: user.photoURL,
    };
  } catch (error) {
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in window was closed before completing.");
    } else if (error.code === "auth/unauthorized-domain") {
      throw new Error("This domain is not authorized for OAuth operations in Firebase Console (Authentication -> Settings -> Authorized domains).");
    } else if (error.code === "auth/operation-not-allowed") {
      throw new Error("Google Sign-In is not enabled in Firebase Console (Authentication -> Sign-in method -> Google).");
    }
    throw error;
  }
}

/**
 * Send password reset email via Firebase Authentication
 */
export async function requestPasswordReset(email) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error(
      "Firebase Authentication is not configured. Please set VITE_FIREBASE_API_KEY and VITE_FIREBASE_AUTH_DOMAIN to dispatch password reset emails."
    );
  }

  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: `Password reset instructions have been dispatched to ${email}. Please check your inbox.`,
    };
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      throw new Error("No user registered with this email address.");
    } else if (error.code === "auth/invalid-email") {
      throw new Error("Please enter a valid email address.");
    }
    throw error;
  }
}

export { auth };
export default app;
