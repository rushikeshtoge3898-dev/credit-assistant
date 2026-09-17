import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

// Environment-driven Firebase Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Check if valid Firebase configuration is present
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "your-api-key" &&
  firebaseConfig.authDomain
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
    console.warn("Firebase initialization error:", err);
  }
}

/**
 * Sign in using Google OAuth Popup with Firebase Authentication
 */
export async function signInWithGoogle() {
  if (!isFirebaseConfigured || !auth) {
    throw new Error(
      "Firebase credentials are not yet configured. Please set VITE_FIREBASE_API_KEY and VITE_FIREBASE_AUTH_DOMAIN in frontend/.env to enable live Google sign-in."
    );
  }
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  return {
    uid: user.uid,
    name: user.displayName || "Google User",
    email: user.email,
    photoURL: user.photoURL,
  };
}

/**
 * Send password reset email via Firebase Authentication
 */
export async function requestPasswordReset(email) {
  if (!isFirebaseConfigured || !auth) {
    // Return friendly simulated success if Firebase not configured yet
    console.info(
      `Password reset requested for: ${email}. Add Firebase config in .env for production SMTP delivery.`
    );
    return {
      success: true,
      simulated: true,
      message: `Password reset link simulated for ${email}. (Add Firebase config in .env for production email delivery).`,
    };
  }
  await sendPasswordResetEmail(auth, email);
  return {
    success: true,
    simulated: false,
    message: `Password reset link sent to ${email}. Check your email inbox.`,
  };
}

/**
 * Initialize reCAPTCHA verifier for Phone OTP
 */
export function createRecaptchaVerifier(containerId, callback) {
  if (!isFirebaseConfigured || !auth) {
    return null;
  }
  return new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      if (callback) callback();
    },
    "expired-callback": () => {
      console.warn("reCAPTCHA expired");
    },
  });
}

/**
 * Send SMS OTP using Firebase Authentication
 */
export async function sendPhoneOtp(phoneNumber, appVerifier) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error(
      "Firebase Phone Authentication requires VITE_FIREBASE_API_KEY in frontend/.env."
    );
  }
  return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
}

export { auth };
export default app;
