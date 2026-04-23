import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import type { User } from "firebase/auth";
import { auth } from "../firebase/firebase.config";
import { AuthContext } from "./AuthContext";
import type { UserRole } from "./AuthContext";
import { GoogleAuthProvider, signInWithPopup, signOut, updateProfile, deleteUser } from 'firebase/auth';

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>(null); // fetched from MongoDB after login
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth!, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                try {
                    // look up the user's role in MongoDB using their Firebase UID
                    const res = await fetch(`/api/users/${currentUser.uid}`);
                    if (res.ok) {
                        const data = await res.json();
                        setRole(data.role ?? null);
                    } else {
                        setRole(null); // 404 or 503 — MongoDB missing or user doc not created yet
                    }
                } catch {
                    setRole(null); // network error — degrade gracefully
                }
            } else {
                setRole(null); // logged out
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        user,
        role,
        loading,
        firebaseConfigured: Boolean(auth),
        createUser: (email: string, password: string) => createUserWithEmailAndPassword(auth!, email, password),
        signInUser: (email: string, password: string) => signInWithEmailAndPassword(auth!, email, password),
        signOutUser: () => signOut(auth!),
        resetUserPassword: (email: string) => sendPasswordResetEmail(auth!, email),
        signInWithGoogle: () => signInWithPopup(auth!, new GoogleAuthProvider()),
        updateUserProfile: (profile: { displayName?: string; photoURL?: string}) => updateProfile(auth!.currentUser!, profile),
        // deletes MongoDB doc (if found) then deletes the Firebase account
        deleteAccount: async () => {
            const uid = auth!.currentUser!.uid;
            try {
                await fetch(`/api/users/${uid}`, { method: "DELETE" });
            } catch {
                // MongoDB unavailable — continue to Firebase deletion anyway
            }
            await deleteUser(auth!.currentUser!);
        },
    };

    //This gives us wrappers to handle auth actions with firebase and populates state with variables that buttons can use

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;

