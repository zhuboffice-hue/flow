import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Avatar from '../components/ui/Avatar';
import { CURRENCY_OPTIONS } from '../lib/models';

const Onboarding = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        companyName: '',
        subdomain: '',
        timezone: '',
        currency: '',
        logo: null
    });

    const handleNext = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-lg mb-4 shadow-lg shadow-primary/30">
                    <Icon name="Layers" className="text-white" size={24} />
                </div>
                <h1 className="text-h1 font-bold text-text-primary">Create your company</h1>
                <p className="text-text-secondary mt-2">Get started with FLOW in less than 2 minutes.</p>
            </div>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form Card */}
                <div className="bg-surface p-8 rounded-xl shadow-lg border border-border">
                    <div className="space-y-6">
                        <Input
                            label="Company Name"
                            placeholder="e.g. Acme Inc."
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            icon="Building2"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Subdomain"
                                placeholder="acme"
                                value={formData.subdomain}
                                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                                icon="Globe"
                            />
                            <div className="flex items-end pb-2 text-muted text-small">.flow.com</div>
                        </div>

                        <Select
                            label="Timezone"
                            options={[
                                { value: 'UTC', label: 'UTC (GMT+0)' },
                                { value: 'EST', label: 'EST (GMT-5)' },
                                { value: 'PST', label: 'PST (GMT-8)' },
                            ]}
                        />

                        <Select
                            label="Currency"
                            value={formData.currency} // Ensure value is bound
                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                            options={CURRENCY_OPTIONS}
                        />

                        <div className="pt-4">
                            <Button className="w-full" size="lg" onClick={handleNext}>
                                Create Workspace
                                <Icon name="ArrowRight" className="ml-2" size={18} />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Preview Card */}
                <div className="hidden md:flex flex-col justify-center">
                    <div className="bg-surface rounded-xl shadow-2xl border border-border overflow-hidden opacity-90 scale-95 origin-top-left transform rotate-1">
                        {/* Fake Header */}
                        <div className="h-12 bg-gray-50 border-b border-border flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        {/* Fake Sidebar + Content */}
                        <div className="flex h-64">
                            <div className="w-16 bg-gray-50 border-r border-border flex flex-col items-center py-4 gap-4">
                                <div className="w-8 h-8 bg-primary rounded-md"></div>
                                <div className="w-6 h-6 bg-gray-200 rounded-md"></div>
                                <div className="w-6 h-6 bg-gray-200 rounded-md"></div>
                            </div>
                            <div className="flex-1 p-6">
                                <div className="h-8 w-32 bg-gray-100 rounded mb-4"></div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="h-24 bg-gray-50 rounded border border-border"></div>
                                    <div className="h-24 bg-gray-50 rounded border border-border"></div>
                                    <div className="h-24 bg-gray-50 rounded border border-border"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="text-center text-small text-muted mt-8">
                        Preview of your workspace
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
