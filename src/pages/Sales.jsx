import React, { useState, useEffect } from 'react';
import ThreePaneLayout from '../components/layout/ThreePaneLayout';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import SalesDashboard from '../components/sales/SalesDashboard';
import PipelineBoard from '../components/sales/PipelineBoard';
import ProposalTemplates from '../components/sales/ProposalTemplates';

import CreateLeadModal from '../components/sales/CreateLeadModal';

import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const Sales = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [leads, setLeads] = useState([]);
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        // Fetch Leads
        const qLeads = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
        const unsubscribeLeads = onSnapshot(qLeads, (snapshot) => {
            const leadsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setLeads(leadsData);
        });

        // Fetch Employees
        const qEmployees = collection(db, 'employees');
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
    }, []);

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
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                stage: 'new', // Default stage
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

    return (
        <ThreePaneLayout>
            <div className="flex flex-col h-full bg-background">
                {/* Header */}
                <div className="bg-surface border-b border-border p-6 flex justify-between items-center">
                    <h1 className="text-h2 font-bold text-text-primary">Sales & CRM</h1>
                    <div className="flex gap-3">
                        <Button onClick={() => setIsCreateModalOpen(true)}>
                            <Icon name="Plus" size={16} className="mr-2" /> New Lead
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-surface border-b border-border px-6">
                    <div className="flex gap-6">
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
                    {activeTab === 'pipeline' && <PipelineBoard leads={leads} employees={employees} />}
                    {activeTab === 'proposals' && <ProposalTemplates />}
                </div>
            </div>
            {isCreateModalOpen && (
                <CreateLeadModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSave={handleCreateLead}
                    employees={employees}
                />
            )}
        </ThreePaneLayout>
    );
};

export default Sales;
