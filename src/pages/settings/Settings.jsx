import React, { useState } from 'react';
import Layout from '../../components/layout/ThreePaneLayout';
import Icon from '../../components/ui/Icon';
import ProfileSettings from './ProfileSettings';
import CompanySettings from './CompanySettings';
import TeamSettings from './TeamSettings';
import BillingSettings from './BillingSettings';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { id: 'profile', label: 'My Profile', icon: 'User' },
        { id: 'company', label: 'Company', icon: 'Building2' },
        { id: 'team', label: 'Team Members', icon: 'Users' },
        { id: 'notifications', label: 'Notifications', icon: 'Bell' },
        { id: 'billing', label: 'Billing', icon: 'CreditCard' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileSettings />;
            case 'company':
                return <CompanySettings />;
            case 'team':
                return <TeamSettings />;
            case 'notifications':
                return <NotificationSettings />;
            case 'billing':
                return <BillingSettings />;
            default:
                return <ProfileSettings />;
        }
    };

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-h1 font-bold text-text-primary">Settings</h1>
                    <p className="text-text-secondary">Manage your account preferences and company settings.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <div className="w-full lg:w-64 flex-shrink-0">
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                                        }`}
                                >
                                    <Icon name={tab.icon} size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Settings;
