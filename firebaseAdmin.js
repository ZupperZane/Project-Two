import "dotenv/config";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let firebaseAdminReady = false;
let firebaseAdminInitError = "";

function parseServiceAccountFromEnv(rawValue) {
  if (!rawValue || typeof rawValue !== "string") {
    return null;
  }

  const parsed = JSON.parse(rawValue);
  if (parsed.private_key && typeof parsed.private_key === "string") {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }

  return parsed;
}

function initializeFirebaseAdmin() {
  try {
    if (getApps().length > 0) {
      firebaseAdminReady = true;
      return;
    }

    const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const hasAdcPath = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);

    if (serviceAccountRaw) {
      const serviceAccount = parseServiceAccountFromEnv(serviceAccountRaw);
      initializeApp({ credential: cert(serviceAccount) });
      firebaseAdminReady = true;
      return;
    }

    if (hasAdcPath) {
      initializeApp({ credential: applicationDefault() });
      firebaseAdminReady = true;
      return;
    }

    firebaseAdminReady = false;
    firebaseAdminInitError =
      "Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS.";
  } catch (error) {
    firebaseAdminReady = false;
    firebaseAdminInitError =
      error instanceof Error ? error.message : "Unknown Firebase Admin init error.";
  }
}

initializeFirebaseAdmin();

export function hasFirebaseAdmin() {
  return firebaseAdminReady;
}

export function getFirebaseAdminInitError() {
  return firebaseAdminInitError;
}

export function getFirebaseAdminAuth() {
  if (!firebaseAdminReady) {
    throw new Error(firebaseAdminInitError || "Firebase Admin is not configured.");
  }

  return getAuth();
}
