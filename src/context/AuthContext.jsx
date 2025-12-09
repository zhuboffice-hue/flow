import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const signup = async (email, password, name, companyDetails) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });

        // Create Company Document
        const companyRef = doc(collection(db, 'companies'));
        await setDoc(companyRef, {
            name: companyDetails.name,
            industry: companyDetails.industry,
            size: companyDetails.size,
            plan: companyDetails.plan || 'free',
            createdAt: new Date(),
            ownerId: user.uid
        });

        // Create User Document
        await setDoc(doc(db, 'users', user.uid), {
            name,
            email,
            role: 'Admin',
            companyId: companyRef.id,
            createdAt: new Date()
        });

        return user;
    };

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = () => {
        return signOut(auth);
    };

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Subscribe to user document
                const unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), async (docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        let companyData = null;

                        if (userData.companyId) {
                            try {
                                const companyDoc = await getDoc(doc(db, 'companies', userData.companyId));
                                if (companyDoc.exists()) {
                                    companyData = companyDoc.data();
                                }
                            } catch (error) {
                                console.error("Error fetching company:", error);
                            }
                        }

                        setCurrentUser({ ...user, ...userData, company: companyData });
                    } else {
                        setCurrentUser(user);
                    }
                    setLoading(false);
                });

                return () => unsubscribeUser();
            } else {
                setCurrentUser(null);
                setLoading(false);
            }
        });

        return unsubscribeAuth;
    }, []);

    const value = {
        currentUser,
        signup,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Helper for Firestore imports inside the function to avoid circular deps if any, 
// but here we import at top level.
import { collection } from 'firebase/firestore';
