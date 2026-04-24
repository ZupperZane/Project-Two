import { useState, useEffect, useCallback } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  updateProfile,
  deleteUser,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "../firebase/firebase.config";
import { AuthContext } from "./AuthContext";
import type { UserRole } from "./AuthContext";

type MeResponse = {
  user?: {
    role?: UserRole;
  };
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = useCallback(async (currentUser: User) => {
    const idToken = await currentUser.getIdToken();
    return {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    };
  }, []);

  const fetchMyRole = useCallback(async (currentUser: User) => {
    const headers = await getAuthHeaders(currentUser);
    const response = await fetch("/api/users/me", {
      method: "GET",
      headers,
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: HTTP ${response.status}`);
    }

    const data = (await response.json()) as MeResponse;
    return data.user?.role ?? null;
  }, [getAuthHeaders]);

  const bootstrapUserProfile = useCallback(async (requestedRole: Exclude<UserRole, null>) => {
    if (!auth?.currentUser) {
      throw new Error("No authenticated user.");
    }

    const headers = await getAuthHeaders(auth.currentUser);
    const response = await fetch("/api/users/bootstrap", {
      method: "POST",
      headers,
      body: JSON.stringify({ role: requestedRole }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || `Bootstrap failed: HTTP ${response.status}`);
    }

    const data = (await response.json()) as MeResponse;
    setRole(data.user?.role ?? null);
  }, [getAuthHeaders]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth!, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const resolvedRole = await fetchMyRole(currentUser);
        setRole(resolvedRole ?? null);
      } catch {
        setRole(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [fetchMyRole]);

  const value = {
    user,
    role,
    loading,
    firebaseConfigured: Boolean(auth),
    createUser: (email: string, password: string) =>
      createUserWithEmailAndPassword(auth!, email, password),
    signInUser: (email: string, password: string) =>
      signInWithEmailAndPassword(auth!, email, password),
    signOutUser: () => signOut(auth!),
    resetUserPassword: (email: string) => sendPasswordResetEmail(auth!, email),
    signInWithGoogle: () => signInWithPopup(auth!, new GoogleAuthProvider()),
    bootstrapUserProfile,
    updateUserProfile: (profile: { displayName?: string; photoURL?: string }) =>
      updateProfile(auth!.currentUser!, profile),
    deleteAccount: async () => {
      if (auth?.currentUser) {
        try {
          const headers = await getAuthHeaders(auth.currentUser);
          await fetch("/api/users/me", { method: "DELETE", headers });
        } catch {
          // Continue with Firebase account deletion even if Mongo cleanup fails.
        }
        await deleteUser(auth.currentUser);
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
