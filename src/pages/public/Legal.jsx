import React, { useState } from 'react';

const Legal = () => {
    const [activeTab, setActiveTab] = useState('terms');

    return (
        <div className="py-24 bg-background">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                <div className="flex justify-center mb-12 border-b border-border">
                    {['terms', 'privacy', 'refund'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 text-sm font-medium capitalize transition-colors border-b-2 ${activeTab === tab
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            {tab} Policy
                        </button>
                    ))}
                </div>

                <div className="prose prose-slate max-w-none">
                    {activeTab === 'terms' && (
                        <div>
                            <h1>Terms of Service</h1>
                            <p><strong>Last Updated: December 2025</strong></p>
                            <p>
                                FLOW provides project, client, finance, and automation tools. Users must comply with fair use and data protection policies. By creating an account, you agree to our terms outlined below.
                            </p>
                            <h3>1. Usage</h3>
                            <p>You agree to use FLOW only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the platform.</p>
                            <h3>2. Account</h3>
                            <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div>
                            <h1>Privacy Policy</h1>
                            <p><strong>Last Updated: December 2025</strong></p>
                            <p>We do not sell your data. We encrypt user information and provide full GDPR compliance.</p>
                            <h3>1. Data Collection</h3>
                            <p>We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us.</p>
                            <h3>2. Data Usage</h3>
                            <p>We use the information we collect to provide, maintain, and improve our services, such as to process transactions and send you related information.</p>
                        </div>
                    )}

                    {activeTab === 'refund' && (
                        <div>
                            <h1>Refund Policy</h1>
                            <p><strong>Last Updated: December 2025</strong></p>
                            <p>Subscriptions can be refunded within 7 days of purchase if no heavy usage occurred.</p>
                            <h3>1. Eligibility</h3>
                            <p>To be eligible for a refund, you must contact our support team within 7 days of your initial purchase.</p>
                            <h3>2. Process</h3>
                            <p>Refunds are processed within 5-10 business days and returned to the original payment method.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Legal;
