import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/ui/Icon';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { db, storage } from '../../lib/firebase';
import { CURRENCY_OPTIONS } from '../../lib/models';

const CompanySettings = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);

    const [companyData, setCompanyData] = useState({
        name: '',
        website: '',
        address: '',
        size: '1-10',
        industry: '',
        logoURL: '',
        currency: 'USD'
    });

    useEffect(() => {
        const fetchCompany = async () => {
            if (currentUser?.companyId) {
                try {
                    const companyDoc = await getDoc(doc(db, 'companies', currentUser.companyId));
                    if (companyDoc.exists()) {
                        const data = companyDoc.data();
                        setCompanyData({
                            name: data.name || '',
                            website: data.website || '',
                            address: data.address || '',
                            size: data.size || '1-10',
                            industry: data.industry || '',
                            logoURL: data.logoURL || '',
                            currency: data.currency || 'USD'
                        });
                    }
                } catch (err) {
                    console.error("Error fetching company:", err);
                }
            }
        };
        fetchCompany();
    }, [currentUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCompanyData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !currentUser?.companyId) return;

        setUploading(true);
        setError('');
        try {
            // Upload to Cloudinary
            const downloadURL = await uploadToCloudinary(file);

            setCompanyData(prev => ({ ...prev, logoURL: downloadURL }));

            // Auto-save the logo URL to firestore
            const companyRef = doc(db, 'companies', currentUser.companyId);
            await updateDoc(companyRef, { logoURL: downloadURL });

            setSuccess('Logo uploaded successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error("Error uploading logo:", err);
            setError("Failed to upload logo.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!currentUser?.companyId) return;

        setLoading(true);
        setSuccess('');
        setError('');

        try {
            const companyRef = doc(db, 'companies', currentUser.companyId);
            await updateDoc(companyRef, {
                name: companyData.name,
                website: companyData.website,
                address: companyData.address,
                size: companyData.size,
                industry: companyData.industry,
                currency: companyData.currency
            });
            setSuccess('Company details updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error("Error updating company:", err);
            setError('Failed to update company details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-surface p-6 rounded-lg border border-border">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-text-primary">Company Details</h3>
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

                <div className="space-y-6">
                    {/* Logo Upload */}
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden relative">
                            {companyData.logoURL ? (
                                <img src={companyData.logoURL} alt="Company Logo" className="w-full h-full object-cover" />
                            ) : (
                                <Icon name="Image" size={24} className="text-gray-400" />
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="font-medium text-text-primary">Company Logo</p>
                            <p className="text-sm text-text-secondary mb-2">Recommended size: 400x400px</p>
                            <label className="cursor-pointer text-sm text-primary hover:text-primary-dark font-medium">
                                Upload new logo
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleLogoUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Company Name</label>
                            <input
                                type="text"
                                name="name"
                                value={companyData.name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Website</label>
                            <input
                                type="url"
                                name="website"
                                value={companyData.website}
                                onChange={handleChange}
                                placeholder="https://example.com"
                                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <div className="col-span-full space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Address</label>
                            <input
                                type="text"
                                name="address"
                                value={companyData.address}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Company Size</label>
                            <select
                                name="size"
                                value={companyData.size}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
                            >
                                <option value="1-10">1-10 employees</option>
                                <option value="10-50">10-50 employees</option>
                                <option value="50-200">50-200 employees</option>
                                <option value="200+">200+ employees</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Industry</label>
                            <input
                                type="text"
                                name="industry"
                                value={companyData.industry}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Currency</label>
                            <select
                                name="currency"
                                value={companyData.currency}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary transition-colors"
                            >
                                {CURRENCY_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <p className="text-xs text-text-secondary">Used for all financial calculations.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanySettings;
