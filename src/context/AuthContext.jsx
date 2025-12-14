import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const signup = async (email, password, name, companyDetails, existingCompanyId = null) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });

        let companyId = existingCompanyId;

        if (!companyId) {
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
            companyId = companyRef.id;
        }

        // Create User Document
        await setDoc(doc(db, 'users', user.uid), {
            name,
            email,
            role: 'Admin',
            companyId: companyId,
            createdAt: new Date()
        });

        return user;
    };

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const loginWithGoogle = async () => {
        console.log("AuthContext: loginWithGoogle popup called");
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            console.log("AuthContext: Popup success user:", user.uid);

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
        } catch (error) {
            console.error("AuthContext: loginWithGoogle popup error", error);
            alert(`Login failed: ${error.message}`);
        }
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

                                // Load Employee Permissions
                                const qEmp = query(
                                    collection(db, 'employees'),
                                    where('email', '==', userData.email),
                                    where('companyId', '==', userData.companyId)
                                );
                                const empSnap = await getDocs(qEmp);
                                if (!empSnap.empty) {
                                    const empData = empSnap.docs[0].data();
                                    if (empData.allowedModules) {
                                        userData.allowedModules = empData.allowedModules;
                                    }
                                }
                            } catch (error) {
                                console.error("Error fetching company/employee:", error);
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
