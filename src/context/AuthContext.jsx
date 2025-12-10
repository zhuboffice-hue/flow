import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot, collection } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

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

    const loginWithGoogle = async () => {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if user document exists
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            // New user via Google Auth
            // Create a default company for them
            const companyRef = doc(collection(db, 'companies'));
            await setDoc(companyRef, {
                name: `${user.displayName}'s Company`,
                industry: 'Other',
                size: '1-10',
                plan: 'free',
                createdAt: new Date(),
                ownerId: user.uid
            });

            // Create User Document
            await setDoc(userDocRef, {
                name: user.displayName,
                email: user.email,
                role: 'Admin',
                companyId: companyRef.id,
                photoURL: user.photoURL,
                createdAt: new Date()
            });
        }

        return user;
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
        loginWithGoogle,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
