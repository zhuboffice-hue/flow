import React, { useState } from 'react';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';

const ClientPortal = () => {
    const [activeTab, setActiveTab] = useState('projects');

    const tabs = [
        { id: 'projects', label: 'Projects', icon: 'Folder' },
        { id: 'deliverables', label: 'Deliverables', icon: 'Box' },
        { id: 'files', label: 'Files', icon: 'FileText' },
        { id: 'invoices', label: 'Invoices', icon: 'CreditCard' },
        { id: 'messages', label: 'Messages', icon: 'MessageSquare' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'projects':
                return (
                    <div className="space-y-4">
                        <div className="bg-surface p-4 rounded-lg border border-border">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-text-primary">Website Redesign</h3>
                                <Badge variant="primary">In Progress</Badge>
                            </div>
                            <p className="text-small text-text-secondary mb-4">Revamping the corporate website with new branding.</p>
                            <div className="mb-2 flex justify-between text-xs text-text-secondary">
                                <span>Progress</span>
                                <span>65%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: '65%' }}></div>
                            </div>
                        </div>
                    </div>
                );
            case 'deliverables':
                return (
                    <div className="space-y-4">
                        <div className="bg-surface p-4 rounded-lg border border-border">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                    <Icon name="Image" size={20} />
                                </div>
                                <div>
                                    <h4 className="font-medium text-text-primary">Homepage Mockup v2</h4>
                                    <p className="text-xs text-text-secondary">Uploaded 2 hours ago</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" className="flex-1">Approve</Button>
                                <Button size="sm" variant="secondary" className="flex-1">Request Changes</Button>
                            </div>
                        </div>
                    </div>
                );
            case 'files':
                return (
                    <div className="space-y-3">
                        {['Contract.pdf', 'Brand_Guidelines.pdf', 'Logo_Pack.zip'].map((file, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border">
                                <div className="flex items-center gap-3">
                                    <Icon name="FileText" size={18} className="text-muted" />
                                    <span className="text-small text-text-primary">{file}</span>
                                </div>
                                <Icon name="Download" size={16} className="text-primary" />
                            </div>
                        ))}
                    </div>
                );
            case 'invoices':
                return (
                    <div className="space-y-4">
                        <div className="bg-surface p-4 rounded-lg border border-border">
                            <div className="flex justify-between mb-2">
                                <span className="font-medium text-text-primary">INV-1001</span>
                                <Badge variant="danger">Unpaid</Badge>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-text-secondary">Due Dec 15, 2025</p>
                                    <p className="text-xl font-bold text-text-primary">$5,000.00</p>
                                </div>
                                <Button size="sm">Pay Now</Button>
                            </div>
                        </div>
                    </div>
                );
            case 'messages':
                return (
                    <div className="space-y-4">
                        <div className="bg-surface p-4 rounded-lg border border-border">
                            <div className="flex items-center gap-3 mb-2">
                                <Avatar name="John Doe" size="sm" />
                                <div>
                                    <p className="text-small font-bold text-text-primary">John Doe</p>
                                    <p className="text-xs text-text-secondary">Project Manager</p>
                                </div>
                                <span className="ml-auto text-xs text-muted">10:30 AM</span>
                            </div>
                            <p className="text-small text-text-secondary">
                                Hi Alice, just uploaded the latest mockups for your review. Let me know what you think!
                            </p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0">
            {/* Mobile Header */}
            <div className="bg-surface border-b border-border p-4 sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-primary rounded-md p-1">
                        <Icon name="Layers" className="text-white" size={16} />
                    </div>
                    <span className="font-bold text-text-primary">FLOW Portal</span>
                </div>
                <Avatar name="Alice Smith" size="sm" />
            </div>

            {/* Content */}
            <div className="p-4 max-w-md mx-auto">
                <h2 className="text-xl font-bold text-text-primary mb-4 capitalize">{activeTab}</h2>
                {renderContent()}
            </div>

            {/* Mobile Bottom Nav */}
            <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex justify-around p-2 z-10 md:hidden">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTab === tab.id ? 'text-primary' : 'text-muted hover:text-text-primary'
                            }`}
                    >
                        <Icon name={tab.icon} size={20} />
                        <span className="text-[10px] font-medium">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Desktop Sidebar (Hidden on mobile) */}
            <div className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-surface border-r border-border p-4">
                <nav className="space-y-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-small font-medium transition-colors ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-background'
                                }`}
                        >
                            <Icon name={tab.icon} size={18} />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
};

export default ClientPortal;
