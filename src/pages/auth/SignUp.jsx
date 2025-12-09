import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Icon from '../../components/ui/Icon';

const SignUp = () => {
    const [searchParams] = useSearchParams();
    const plan = searchParams.get('plan') || 'free';

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        companyName: '',
        industry: 'Technology',
        size: '1-10'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (step === 1) {
            setStep(2);
            return;
        }

        try {
            setError('');
            setLoading(true);
            await signup(formData.email, formData.password, formData.name, {
                name: formData.companyName,
                industry: formData.industry,
                size: formData.size,
                plan
            });
            navigate('/app');
        } catch (err) {
            console.error("Signup error:", err);
            if (err.code === 'auth/operation-not-allowed') {
                setError('Email/Password sign-in is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('An account with this email already exists.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            } else {
                setError('Failed to create account: ' + err.message);
            }
        } finally {
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
                        Create your account
                    </h2>
                    <p className="mt-2 text-sm text-text-secondary">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-primary hover:text-primary-hover">
                            Sign in
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {step === 1 ? (
                        <div className="space-y-4">
                            <Input
                                label="Full Name"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                            />
                            <Input
                                label="Email address"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                            />
                            <Input
                                label="Password"
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Input
                                label="Company Name"
                                name="companyName"
                                required
                                value={formData.companyName}
                                onChange={handleChange}
                            />
                            <Select
                                label="Industry"
                                name="industry"
                                value={formData.industry}
                                onChange={handleChange}
                                options={[
                                    { value: 'Technology', label: 'Technology' },
                                    { value: 'Marketing', label: 'Marketing' },
                                    { value: 'Design', label: 'Design' },
                                    { value: 'Consulting', label: 'Consulting' },
                                    { value: 'Other', label: 'Other' }
                                ]}
                            />
                            <Select
                                label="Company Size"
                                name="size"
                                value={formData.size}
                                onChange={handleChange}
                                options={[
                                    { value: '1-10', label: '1-10 employees' },
                                    { value: '11-50', label: '11-50 employees' },
                                    { value: '51-200', label: '51-200 employees' },
                                    { value: '201+', label: '201+ employees' }
                                ]}
                            />
                        </div>
                    )}

                    {error && <div className="text-danger text-sm text-center">{error}</div>}

                    <div className="flex gap-4">
                        {step === 2 && (
                            <Button type="button" variant="secondary" onClick={() => setStep(1)} className="w-full">
                                Back
                            </Button>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Creating Account...' : (step === 1 ? 'Next' : 'Create Account')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignUp;
