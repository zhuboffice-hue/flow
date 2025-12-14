import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/ui/Icon';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { ref, getDownloadURL } from 'firebase/storage';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { db, storage, auth } from '../../lib/firebase';

const ProfileSettings = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);

    // 2FA State
    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [step, setStep] = useState('phone'); // 'phone' | 'verify'

    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        phone: '',
        bio: '',
        jobTitle: '',
        role: '' // System role, read-only in UI usually
    });

    useEffect(() => {
        if (currentUser) {
            setFormData({
                displayName: currentUser.displayName || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                bio: currentUser.bio || '',
                jobTitle: currentUser.jobTitle || '',
                role: currentUser.role || ''
            });

            // ... (2FA fetch)
        }
    }, [currentUser]);

    // ... (handleChange)

    const handlePromoteToSuperAdmin = async () => {
        if (!currentUser) return;
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, { role: 'SuperAdmin' });
            setSuccess('Promoted to Super Admin! Please refresh.');
            // Update local state to reflect immediately
            setFormData(prev => ({ ...prev, role: 'SuperAdmin' }));
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            console.error("Error promoting:", error);
            setError("Failed to promote.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // ... (clear errors)

        try {
            if (currentUser.displayName !== formData.displayName) {
                await updateProfile(currentUser, { displayName: formData.displayName });
            }

            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                name: formData.displayName,
                phone: formData.phone,
                bio: formData.bio,
                jobTitle: formData.jobTitle // Saved as jobTitle now
                // role is NOT updated here to prevent overwriting
            });

            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            // ... (error handling)
        } finally {
            setLoading(false);
        }
    };

    const handleEnable2FA = async () => {
        if (step === 'phone') {
            if (!phoneNumber) {
                setError("Please enter a phone number.");
                return;
            }
            // Simulate sending code
            setStep('verify');
            setSuccess("Verification code sent to " + phoneNumber);
            setTimeout(() => setSuccess(''), 3000);
        } else {
            if (verificationCode !== '123456') {
                setError("Invalid code. Use 123456 for testing.");
                return;
            }
            // Enable 2FA
            try {
                const userRef = doc(db, 'users', currentUser.uid);
                await updateDoc(userRef, { twoFactorEnabled: true });
                setTwoFactorEnabled(true);
                setIs2FAModalOpen(false);
                setSuccess("Two-Factor Authentication enabled!");
                setTimeout(() => setSuccess(''), 3000);
                setStep('phone');
                setVerificationCode('');
            } catch (err) {
                console.error("Error enabling 2FA:", err);
                setError("Failed to enable 2FA.");
            }
        }
    };

    const handleDisable2FA = async () => {
        if (window.confirm("Are you sure you want to disable 2FA?")) {
            try {
                const userRef = doc(db, 'users', currentUser.uid);
                await updateDoc(userRef, { twoFactorEnabled: false });
                setTwoFactorEnabled(false);
                setSuccess("Two-Factor Authentication disabled.");
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                console.error("Error disabling 2FA:", err);
                setError("Failed to disable 2FA.");
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-surface p-6 rounded-lg border border-border">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-surface relative">
                            {currentUser?.photoURL ? (
                                <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <Icon name="User" size={40} className="text-gray-400" />
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                </div>
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-md hover:bg-primary-dark transition-colors cursor-pointer">
                            <Icon name="Camera" size={16} />
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePhotoUpload}
                                disabled={uploading}
                            />
                        </label>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-text-primary">{formData.displayName || 'User Name'}</h2>
                        <p className="text-text-secondary">{formData.role || 'No Role Set'}</p>
                        <p className="text-sm text-text-muted mt-1">{formData.email}</p>
                    </div>
                </div>
            </div>

            {/* Personal Information Form */}
            <div className="bg-surface p-6 rounded-lg border border-border">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-text-primary">Personal Information</h3>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                        Save Changes
                    </button>
                </div>

                {success && (
                    <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm flex items-center gap-2">
                        <Icon name="CheckCircle" size={16} />
                        {success}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm flex items-center gap-2">
                        <Icon name="AlertCircle" size={16} />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary">Full Name</label>
                        <input
                            type="text"
                            name="displayName"
                            value={formData.displayName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            disabled
                            className="w-full px-3 py-2 bg-gray-50 border border-border rounded-md text-text-muted cursor-not-allowed"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+1 (555) 000-0000"
                            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary">Job Title</label>
                        <input
                            type="text"
                            name="jobTitle"
                            value={formData.jobTitle}
                            onChange={handleChange}
                            placeholder="e.g. Product Designer"
                            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary">System Role</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={formData.role}
                                disabled
                                className="w-full px-3 py-2 bg-gray-50 border border-border rounded-md text-text-muted cursor-not-allowed"
                            />
                            {formData.role !== 'SuperAdmin' && (
                                <button
                                    type="button"
                                    onClick={handlePromoteToSuperAdmin}
                                    className="px-3 py-2 bg-indigo-600 text-white rounded-md text-xs hover:bg-indigo-700 whitespace-nowrap"
                                >
                                    Make Super Admin
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="col-span-full space-y-2">
                        <label className="text-sm font-medium text-text-secondary">Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows="4"
                            placeholder="Tell us a little about yourself..."
                            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary transition-colors resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Security Section */}
            <div className="bg-surface p-6 rounded-lg border border-border">
                <h3 className="text-lg font-bold text-text-primary mb-6">Security</h3>
                <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
                    <div>
                        <p className="font-medium text-text-primary">Password</p>
                        <p className="text-sm text-text-secondary">Last changed 3 months ago</p>
                    </div>
                    <button
                        onClick={handlePasswordReset}
                        className="text-primary hover:text-primary-dark text-sm font-medium"
                    >
                        Change Password
                    </button>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
                    <div>
                        <p className="font-medium text-text-primary">Two-Factor Authentication</p>
                        <p className="text-sm text-text-secondary">
                            {twoFactorEnabled ? 'Enabled via SMS' : 'Add an extra layer of security to your account'}
                        </p>
                    </div>
                    <button
                        onClick={() => twoFactorEnabled ? handleDisable2FA() : setIs2FAModalOpen(true)}
                        className={`text-sm font-medium ${twoFactorEnabled ? 'text-red-500 hover:text-red-600' : 'text-primary hover:text-primary-dark'}`}
                    >
                        {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                    </button>
                </div>
            </div>

            {/* 2FA Modal */}
            {is2FAModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-surface rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-text-primary mb-4">Set up Two-Factor Authentication</h3>
                        <p className="text-text-secondary text-sm mb-6">
                            {step === 'phone'
                                ? "Enter your phone number to receive a verification code."
                                : `Enter the 6-digit code sent to ${phoneNumber}. (Use 123456)`}
                        </p>

                        <div className="space-y-4">
                            {step === 'phone' ? (
                                <div>
                                    <label className="text-sm font-medium text-text-secondary block mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="+1 (555) 000-0000"
                                        className="w-full px-3 py-2 bg-background border border-border rounded-md"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="text-sm font-medium text-text-secondary block mb-1">Verification Code</label>
                                    <input
                                        type="text"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        placeholder="123456"
                                        className="w-full px-3 py-2 bg-background border border-border rounded-md tracking-widest text-center text-lg"
                                    />
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setIs2FAModalOpen(false);
                                        setStep('phone');
                                        setVerificationCode('');
                                    }}
                                    className="px-4 py-2 text-text-secondary hover:text-text-primary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEnable2FA}
                                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
                                >
                                    {step === 'phone' ? 'Send Code' : 'Verify & Enable'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileSettings;
