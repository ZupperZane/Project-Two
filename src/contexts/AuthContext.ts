import { createContext } from "react";
import type { User, UserCredential } from "firebase/auth";

// The two account types, plus null when role is unknown (e.g. MongoDB unavailable)
export type UserRole = "jobseeker" | "job_poster" | null;

export interface AuthContextValue {
  user: User | null;
  role: UserRole;
  loading: boolean;
  firebaseConfigured: boolean;
  createUser: (email: string, password: string) => Promise<UserCredential>;
  signInUser: (email: string, password: string) => Promise<UserCredential>;
  resetUserPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<UserCredential>;
  signOutUser: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateUserProfile: (profile: {
    displayName?: string;
    photoURL?: string;
  }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
