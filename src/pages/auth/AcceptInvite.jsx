import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/ui/Icon';

const AcceptInvite = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const { loginWithGoogle } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [inviteData, setInviteData] = useState(null);
    const [isLoginMode, setIsLoginMode] = useState(false);

    // Fetch invite data
    useEffect(() => {
        const fetchInvite = async () => {
            if (!code) return;
            try {
                const inviteRef = doc(db, 'invitations', code);
                const inviteSnap = await getDoc(inviteRef);

                if (inviteSnap.exists()) {
                    const data = inviteSnap.data();
                    setInviteData(data);
                    setEmail(data.email || '');
                    setName(data.name || '');

                    // Fetch company name and currency if we have companyId
                    if (data.companyId) {
                        try {
                            const companyDoc = await getDoc(doc(db, 'companies', data.companyId));
                            if (companyDoc.exists()) {
                                const cData = companyDoc.data();
                                setInviteData(prev => ({
                                    ...prev,
                                    companyName: cData.name,
                                    currency: cData.currency || 'USD'
                                }));
                            }
                        } catch (e) {
                            console.log("Could not fetch company details", e);
                        }
                    }
                } else {
                    setError("Invitation not found or expired.");
                }
            } catch (err) {
                console.error("Error fetching invite:", err);
                setError("Invalid invitation link.");
            }
        };
        fetchInvite();
    }, [code]);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const user = await loginWithGoogle();
            await processAcceptance(user);
        } catch (err) {
            console.error("Google join error:", err);
            setError("Failed to join with Google.");
            setLoading(false);
        }
    };

    const processAcceptance = async (user) => {
        try {
            // 2. Create or Update User Doc
            await setDoc(doc(db, 'users', user.uid), {
                name: user.displayName || name || '',
                email: user.email,
                role: inviteData?.role || 'Viewer',
                department: inviteData?.department || 'Engineering',
                companyId: inviteData?.companyId,
                currency: inviteData?.currency || 'USD',
                photoURL: user.photoURL || null
            }, { merge: true });

            // 3. Mark invite as accepted
            if (code) {
                await updateDoc(doc(db, 'invitations', code), {
                    status: 'accepted',
                    acceptedAt: new Date(),
                    acceptedBy: user.uid
                });
            }

            // 4. Link Employee Doc
            const employeesRef = collection(db, 'employees');
            const q = query(employeesRef, where('email', '==', user.email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const employeeDoc = querySnapshot.docs[0];
                await updateDoc(doc(db, 'employees', employeeDoc.id), {
                    uid: user.uid,
                    status: 'Active',
                    avatar: user.photoURL || null
                });
            } else {
                // Fallback if employee doc wasn't found by email - create one?
                // Usually InviteMemberModal creates it. If not found, create new.
                await addDoc(collection(db, 'employees'), {
                    name: user.displayName || name,
                    email: user.email,
                    role: inviteData?.role || 'Viewer',
                    department: inviteData?.department || 'Engineering',
                    companyId: inviteData?.companyId,
                    uid: user.uid,
                    status: 'Active',
                    joinedAt: new Date(),
                    avatar: user.photoURL || null,
                    skills: [],
                    workload: 0,
                    availability: 'Available'
                });
            }

            navigate('/app');
        } catch (err) {
            console.error("Process acceptance error:", err);
            setError("Failed to process invitation.");
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let user;

            if (isLoginMode) {
                // Login existing user
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                user = userCredential.user;
            } else {
                // Create new user
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                user = userCredential.user;
                await updateProfile(user, { displayName: name });
            }

            await processAcceptance(user);

        } catch (err) {
            console.error("Join error:", err);
            if (err.code === 'auth/email-already-in-use') {
                setError('An account with this email already exists. Please switch to "Sign In" below.');
            } else if (err.code === 'auth/wrong-password') {
                setError('Incorrect password.');
            } else if (err.code === 'auth/user-not-found') {
                setError('No account found with this email.');
            } else {
                setError('Failed to join: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!code) return <div className="p-10 text-center">Invalid Invite Link</div>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
                        <Icon name={isLoginMode ? "LogIn" : "UserPlus"} className="text-white" size={24} />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-text-primary">
                        {isLoginMode ? 'Welcome Back' : `Join ${inviteData?.companyName || 'the Team'}`}
                    </h2>
                    <p className="mt-2 text-sm text-text-secondary">
                        {isLoginMode
                            ? 'Sign in to accept the invitation.'
                            : 'Set up your account to get started.'}
                    </p>
                </div>

                <div className="space-y-4">
                    <Button
                        variant="secondary"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-background text-text-secondary">Or continue with email</span>
                        </div>
                    </div>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleAccept}>
                    <div className="space-y-4">
                        {!isLoginMode && (
                            <Input
                                label="Full Name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        )}
                        <Input
                            label="Email address"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Input
                            label="Password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && <div className="text-danger text-sm text-center">{error}</div>}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Processing...' : (isLoginMode ? 'Sign In & Join' : 'Create Account & Join')}
                    </Button>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setIsLoginMode(!isLoginMode);
                                setError('');
                            }}
                            className="text-sm text-primary hover:underline font-medium"
                        >
                            {isLoginMode
                                ? "Don't have an account? Create one"
                                : "Already have an account? Sign in"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AcceptInvite;
