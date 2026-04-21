import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import type { User } from "firebase/auth";
import { auth } from "../firebase/firebase.config";
import { AuthContext } from "./AuthContext";
import { GoogleAuthProvider, signInWithPopup, signOut, updateProfile } from 'firebase/auth';

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth!, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return unsubscribe;
       
    }, []);

    //This is just a cleanup function to prevent memory leaks

    const value = {
        user,
        loading,
        firebaseConfigured: Boolean(auth),
        createUser: (email: string, password: string) => createUserWithEmailAndPassword(auth!, email, password),
        signInUser: (email: string, password: string) => signInWithEmailAndPassword(auth!, email, password),
        signOutUser: () => signOut(auth!),
        resetUserPassword: (email: string) => sendPasswordResetEmail(auth!, email),
        signInWithGoogle: () => signInWithPopup(auth!, new GoogleAuthProvider()),
        updateUserProfile: (profile: { displayName?: string; photoURL?: string}) => updateProfile(auth!.currentUser!, profile),
    };

    //This gives us wrappers to handle auth actions with firebase and populates state with variables that buttons can use

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;

