import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDTF_GjuogvDKbOnQ8reOUWiL6_zB5HctY",
  authDomain: "project-two-9.firebaseapp.com",
  projectId: "project-two-9",
  storageBucket: "project-two-9.firebasestorage.app",
  messagingSenderId: "533475531071",
  appId: "1:533475531071:web:fcceb0c00bc664f4799b8a"
};

const requiredKeys: Array<keyof typeof firebaseConfig> = [
  "apiKey",
  "authDomain",
  "projectId",
  "appId",
];

export const hasFirebaseConfig = requiredKeys.every((key) =>
  Boolean(firebaseConfig[key])
);

export const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app
  ? initializeFirestore(app, { localCache: memoryLocalCache() })
  : null;
