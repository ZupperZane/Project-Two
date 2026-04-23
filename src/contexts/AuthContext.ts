import { createContext } from "react";
import type { User, UserCredential } from "firebase/auth";

export type UserRole = "admin" | "employer" | "job_seeker" | null;

export interface AuthContextValue {
  user: User | null;
  role: UserRole;
  loading: boolean;
  firebaseConfigured: boolean;
  createUser: (email: string, password: string) => Promise<UserCredential>;
  signInUser: (email: string, password: string) => Promise<UserCredential>;
  resetUserPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<UserCredential>;
  bootstrapUserProfile: (role: Exclude<UserRole, null>) => Promise<void>;
  signOutUser: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateUserProfile: (profile: {
    displayName?: string;
    photoURL?: string;
  }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
