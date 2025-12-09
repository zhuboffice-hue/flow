import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/ui/Icon';

const AcceptInvite = () => {
    const { code } = useParams();
    const navigate = useNavigate();
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

            // 2. Create or Update User Doc
            await setDoc(doc(db, 'users', user.uid), {
                name: name || user.displayName || '',
                email,
                role: inviteData?.role || 'Viewer',
                department: inviteData?.department || 'Engineering',
                companyId: inviteData?.companyId,
                currency: inviteData?.currency || 'USD', // Set default currency from company
                // Preserve existing createdAt if it exists, otherwise new
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
            // Find employee with same email and update uid
            const employeesRef = collection(db, 'employees');
            const q = query(employeesRef, where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const employeeDoc = querySnapshot.docs[0];
                await updateDoc(doc(db, 'employees', employeeDoc.id), {
                    uid: user.uid,
                    status: 'Active',
                    avatar: user.photoURL || null
                });
            }

            navigate('/app');
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
