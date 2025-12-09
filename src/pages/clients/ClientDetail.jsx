import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ThreePaneLayout from '../../components/layout/ThreePaneLayout';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import Avatar from '../../components/ui/Avatar';
import ClientOverview from '../../components/clients/tabs/ClientOverview';
import ClientProjects from '../../components/clients/tabs/ClientProjects';
import ClientContacts from '../../components/clients/tabs/ClientContacts';
import ClientFiles from '../../components/clients/tabs/ClientFiles';
import ClientApprovals from '../../components/clients/tabs/ClientApprovals';
import ClientCommunication from '../../components/clients/tabs/ClientCommunication';
import ClientInvoices from '../../components/clients/tabs/ClientInvoices';
import ClientNotes from '../../components/clients/tabs/ClientNotes';

import CreateProjectModal from '../../components/projects/CreateProjectModal';

const ClientDetail = () => {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('overview');
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

    useEffect(() => {
        const fetchClient = async () => {
            try {
                const docRef = doc(db, 'clients', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setClient({ id: docSnap.id, ...docSnap.data() });
                } else {
                    console.log("No such client!");
                }
            } catch (error) {
                console.error("Error fetching client:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchClient();
    }, [id]);

    if (loading) {
        return (
            <ThreePaneLayout>
                <div className="flex items-center justify-center h-full">
                    <Icon name="Loader2" className="animate-spin text-primary" size={32} />
                </div>
            </ThreePaneLayout>
        );
    }

    if (!client) {
        return (
            <ThreePaneLayout>
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <p className="text-text-secondary">Client not found.</p>
                    <Link to="/app/clients">
                        <Button variant="secondary">Back to Directory</Button>
                    </Link>
                </div>
            </ThreePaneLayout>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
        { id: 'projects', label: 'Projects', icon: 'Folder' },
        { id: 'contacts', label: 'Contacts', icon: 'Users' },
        { id: 'files', label: 'Files', icon: 'FileText' },
        { id: 'approvals', label: 'Approvals', icon: 'CheckSquare' },
        { id: 'communication', label: 'Communication', icon: 'MessageSquare' },
        { id: 'invoices', label: 'Invoices', icon: 'CreditCard' },
        { id: 'notes', label: 'Notes', icon: 'FileEdit' },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview': return <ClientOverview client={client} />;
            case 'projects': return <ClientProjects clientId={client.id} />;
            case 'contacts': return <ClientContacts clientId={client.id} />;
            case 'files': return <ClientFiles clientId={client.id} />;
            case 'approvals': return <ClientApprovals clientId={client.id} />;
            case 'communication': return <ClientCommunication clientId={client.id} />;
            case 'invoices': return <ClientInvoices clientId={client.id} />;
            case 'notes': return <ClientNotes clientId={client.id} />;
            default: return <ClientOverview client={client} />;
        }
    };

    return (
        <ThreePaneLayout>
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="px-6 py-6 border-b border-border bg-surface">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <Link to="/app/clients" className="text-muted hover:text-text-primary">
                                <Icon name="ArrowLeft" size={20} />
                            </Link>
                            <Avatar name={client.name} size="lg" />
                            <div>
                                <h1 className="text-2xl font-bold text-text-primary">{client.name}</h1>
                                <p className="text-text-secondary text-small">Client ID: #{id}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost"><Icon name="Share" size={16} className="mr-2" /> Share Portal</Button>
                            <Button onClick={() => setIsProjectModalOpen(true)}><Icon name="Plus" size={16} className="mr-2" /> Create Project</Button>
                            <Button variant="ghost" size="icon"><Icon name="MoreVertical" size={16} /></Button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-small font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-background'
                                    }`}
                            >
                                <Icon name={tab.icon} size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-background">
                    {renderTabContent()}
                </div>
            </div>

            <CreateProjectModal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
                clientId={client.id}
                onSuccess={() => {
                    // Optionally refresh or navigate, but real-time listeners handle updates
                }}
            />
        </ThreePaneLayout>
    );
};

export default ClientDetail;
