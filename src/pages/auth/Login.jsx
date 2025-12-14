import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/ui/Icon';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, loginWithGoogle, currentUser } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    React.useEffect(() => {
        if (currentUser) {
            console.log("Login: currentUser found", currentUser);
            console.log("Login: Role is", currentUser.role);
            if (currentUser.role === 'SuperAdmin') {
                console.log("Login: Redirecting to /app/super-admin");
                navigate('/app/super-admin');
            } else {
                console.log("Login: Redirecting to /app");
                navigate('/app');
            }
        }
    }, [currentUser, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await login(email, password);
            // Navigation handled by useEffect
        } catch (err) {
            setError('Failed to log in: ' + err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
                        <Icon name="Layers" className="text-white" size={24} />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-text-primary">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-sm text-text-secondary">
                        Or{' '}
                        <Link to="/signup" className="font-medium text-primary hover:text-primary-hover">
                            start your 14-day free trial
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
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

                    <div className="space-y-3">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </Button>
                        <GoogleLoginButton onError={setError} />
                    </div>
                </form>
            </div>
        </div>
    );
};



const GoogleLoginButton = ({ onError }) => {
    const { loginWithGoogle } = useAuth();
    // Navigation handled by parent useEffect on currentUser change
    // const navigate = useNavigate(); 
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            await loginWithGoogle();
            // No manual navigate here
        } catch (error) {
            console.error("Google Login Error:", error);
            onError("Failed to sign in with Google. Please try again.");
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-surface border border-border text-text-primary font-medium py-2 px-4 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? (
                <div className="h-5 w-5 border-2 border-text-secondary border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
            )}
            <span>Sign in with Google</span>
        </button>
    );
};

export default Login;
