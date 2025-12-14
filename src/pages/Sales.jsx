import React, { useState, useEffect } from 'react';
import ThreePaneLayout from '../components/layout/ThreePaneLayout';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import SalesDashboard from '../components/sales/SalesDashboard';
import PipelineBoard from '../components/sales/PipelineBoard';
import ProposalTemplates from '../components/sales/ProposalTemplates';

import CreateLeadModal from '../components/sales/CreateLeadModal';

import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const Sales = () => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [defaultLeadStage, setDefaultLeadStage] = useState('new');
    const [leads, setLeads] = useState([]);
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        if (!currentUser?.companyId) return;
        // Fetch Leads
        const qLeads = query(collection(db, 'leads'), where('companyId', '==', currentUser.companyId));
        const unsubscribeLeads = onSnapshot(qLeads, (snapshot) => {
            const leadsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Client-side sort
            leadsData.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA; // Descending
            });
            setLeads(leadsData);
        });

        // Fetch Employees
        const qEmployees = query(collection(db, 'employees'), where('companyId', '==', currentUser.companyId));
        const unsubscribeEmployees = onSnapshot(qEmployees, (snapshot) => {
            const employeesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEmployees(employeesData);
        });

        return () => {
            unsubscribeLeads();
            unsubscribeEmployees();
        };
    }, [currentUser]);

    const createNotification = async (recipientId, recipientEmail, message) => {
        try {
            await addDoc(collection(db, 'notifications'), {
                recipientId: recipientId || null,
                recipientEmail: recipientEmail || null,
                content: message,
                isRead: false,
                createdAt: serverTimestamp(),
                type: 'assignment',
                link: '/app/sales'
            });
        } catch (error) {
            console.error("Error creating notification:", error);
        }
    };

    const handleCreateLead = async (data) => {
        try {
            const leadRef = await addDoc(collection(db, 'leads'), {
                ...data,
                companyId: currentUser.companyId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                stage: data.stage || 'new',
                priority: 'Medium', // Default priority
            });

            // Notify Assignee if assigned
            if (data.assigneeId) {
                const assignee = employees.find(e => e.id === data.assigneeId);
                if (assignee) {
                    await createNotification(
                        assignee.uid,
                        assignee.email,
                        `You have been assigned a new lead: ${data.company}`
                    );
                }
            }

            setIsCreateModalOpen(false);
        } catch (error) {
            console.error("Error creating lead: ", error);
        }
    };

    const handleDeleteLead = async (leadId) => {
        if (!window.confirm("Are you sure you want to delete this lead?")) return;
        try {
            await deleteDoc(doc(db, 'leads', leadId));
        } catch (error) {
            console.error("Error deleting lead:", error);
        }
    };

    const handleOpenCreateModal = (stage = 'new') => {
        setDefaultLeadStage(stage);
        setIsCreateModalOpen(true);
    };

    return (
        <ThreePaneLayout>
            <div className="flex flex-col h-full bg-background">
                {/* Header */}
                <div className="bg-surface border-b border-border p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className="text-h2 font-bold text-text-primary">Sales & CRM</h1>
                    <div className="flex gap-3 w-full md:w-auto">
                        <Button onClick={() => handleOpenCreateModal('new')} className="w-full md:w-auto justify-center whitespace-nowrap">
                            <Icon name="Plus" size={16} className="mr-2" /> New Lead
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-surface border-b border-border px-4 md:px-6 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-6 whitespace-nowrap">
                        {['dashboard', 'pipeline', 'proposals'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-surface-secondary/30 p-6">
                    {activeTab === 'dashboard' && <SalesDashboard leads={leads} />}
                    {activeTab === 'pipeline' && (
                        <PipelineBoard
                            leads={leads}
                            employees={employees}
                            onAddLead={handleOpenCreateModal}
                            onDeleteLead={handleDeleteLead}
                        />
                    )}
                    {activeTab === 'proposals' && <ProposalTemplates />}
                </div>
            </div>
            {isCreateModalOpen && (
                <CreateLeadModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSave={handleCreateLead}
                    employees={employees}
                    initialStage={defaultLeadStage}
                />
            )}
        </ThreePaneLayout>
    );
};

export default Sales;
