import { createContext } from "react";
import type { User, UserCredential } from "firebase/auth";

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  firebaseConfigured: boolean;
  createUser: (email: string, password: string) => Promise<UserCredential>;
  signInUser: (email: string, password: string) => Promise<UserCredential>;
  resetUserPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<UserCredential>;
  signOutUser: () => Promise<void>;
  updateUserProfile: (profile: {
    displayName?: string;
    photoURL?: string;
  }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
