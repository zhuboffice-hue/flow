import React, { useState } from 'react';
import Icon from '../ui/Icon';
import Badge from '../ui/Badge';
import LeadDrawer from './LeadDrawer';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../hooks/useCurrency';

const PipelineColumn = ({ title, count, leads, onLeadClick, stageId, onDropLead, currentUser }) => {
    const { formatCurrency, convertAmount } = useCurrency();

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const leadId = e.dataTransfer.getData("leadId");
        if (leadId) {
            onDropLead(leadId, stageId);
        }
    };

    return (
        <div
            className="flex-shrink-0 w-80 flex flex-col h-full bg-surface-secondary/50 rounded-lg border border-border"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <div className="p-3 border-b border-border flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-text-primary uppercase">{title}</h3>
                    <span className="bg-surface text-xs font-medium px-2 py-0.5 rounded-full text-text-secondary border border-border">{count}</span>
                </div>
                <button className="text-text-secondary hover:text-primary">
                    <Icon name="Plus" size={16} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {leads.map((lead) => {
                    const isAssignee = lead.assigneeId === currentUser?.uid;
                    const isAdmin = currentUser?.role === 'Admin';
                    const canDrag = isAssignee || isAdmin;

                    // Parse value to number
                    const val = parseFloat((lead.value || '0').replace(/[^0-9.-]+/g, ""));
                    const rawAmount = isNaN(val) ? 0 : val;

                    return (
                        <div
                            key={lead.id}
                            draggable={canDrag}
                            onDragStart={(e) => {
                                if (canDrag) {
                                    e.dataTransfer.setData("leadId", lead.id);
                                } else {
                                    e.preventDefault();
                                }
                            }}
                            onClick={() => onLeadClick(lead)}
                            className={`bg-surface p-3 rounded border border-border shadow-sm transition-all group ${canDrag
                                ? 'hover:shadow-md cursor-grab active:cursor-grabbing'
                                : 'opacity-80 cursor-default'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-text-primary text-sm">{lead.company}</h4>
                                <button className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-primary transition-opacity">
                                    <Icon name="MoreHorizontal" size={16} />
                                </button>
                            </div>
                            <p className="text-xs text-text-secondary mb-3">{lead.name}</p>
                            <div className="flex justify-between items-center">
                                <Badge variant={lead.priority === 'High' ? 'danger' : lead.priority === 'Medium' ? 'warning' : 'secondary'}>
                                    {lead.priority}
                                </Badge>
                                <span className="text-sm font-bold text-text-primary">
                                    {formatCurrency(rawAmount, lead.currency || 'USD')}
                                </span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-border flex justify-between items-center text-xs text-text-secondary">
                                <div className="flex items-center gap-1">
                                    <Icon name="User" size={12} />
                                    <span>{lead.assignee || 'Unassigned'}</span>
                                </div>
                                <span>{lead.lastActivity}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const PipelineBoard = ({ leads = [], employees = [] }) => {
    const { currentUser } = useAuth();
    const [selectedLead, setSelectedLead] = useState(null);

    // Define stages structure
    const initialStages = [
        { id: 'new', title: 'New Lead' },
        { id: 'contacted', title: 'Contacted' },
        { id: 'qualified', title: 'Qualified' },
        { id: 'proposal', title: 'Proposal Sent' },
        { id: 'negotiation', title: 'Negotiation' },
        { id: 'won', title: 'Closed Won' },
        { id: 'lost', title: 'Closed Lost' },
    ];

    // Group leads by stage
    const stages = initialStages.map(stage => ({
        ...stage,
        leads: leads.filter(lead => (lead.stage || 'new') === stage.id)
    }));

    const handleDropLead = async (leadId, newStageId) => {
        try {
            await updateDoc(doc(db, 'leads', leadId), {
                stage: newStageId,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating lead stage:", error);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Filters */}
            <div className="flex gap-4 mb-4 overflow-x-auto pb-2">
                <select className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-primary">
                    <option>All Sources</option>
                    <option>Website</option>
                    <option>Referral</option>
                </select>
                <select className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-primary">
                    <option>All Assignees</option>
                    {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                </select>
                <select className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-primary">
                    <option>All Values</option>
                    <option>&lt; $10k</option>
                    <option>$10k - $50k</option>
                    <option>&gt; $50k</option>
                </select>
            </div>

            {/* Board */}
            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-4 h-full min-w-max pb-4">
                    {stages.map(stage => (
                        <PipelineColumn
                            key={stage.id}
                            stageId={stage.id}
                            title={stage.title}
                            count={stage.leads.length}
                            leads={stage.leads}
                            onLeadClick={setSelectedLead}
                            onDropLead={handleDropLead}
                            currentUser={currentUser}
                        />
                    ))}
                </div>
            </div>

            {/* Lead Drawer */}
            <LeadDrawer
                lead={selectedLead}
                onClose={() => setSelectedLead(null)}
                employees={employees}
            />
        </div>
    );
};

export default PipelineBoard;
