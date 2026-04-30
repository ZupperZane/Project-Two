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
    status?: string;
    disabledReason?: string | null;
  };
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [banned, setBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);
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
    const isDisabled = data.user?.status === "disabled";
    return {
      role: data.user?.role ?? null,
      banned: isDisabled,
      banReason: isDisabled ? (data.user?.disabledReason ?? null) : null,
    };
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
        setBanned(false);
        setBanReason(null);
        setLoading(false);
        return;
      }

      try {
        const result = await fetchMyRole(currentUser);
        if (result === null) {
          setRole(null);
          setBanned(false);
          setBanReason(null);
        } else {
          setRole(result.role);
          setBanned(result.banned);
          setBanReason(result.banReason);
        }
      } catch {
        setRole(null);
        setBanned(false);
        setBanReason(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [fetchMyRole]);

  const value = {
    user,
    role,
    banned,
    banReason,
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
