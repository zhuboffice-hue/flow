import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/layout/ThreePaneLayout';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import { doc, getDoc, setDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

const TRIGGER_CATEGORIES = {
    "Task Events": ["task.created", "task.updated", "task.status_changed", "task.due_soon", "task.overdue"],
    "Project Events": ["project.created", "project.status_changed"],
    "Client Events": ["client.approval_requested", "client.invoice_overdue"],
    "Finance Events": ["invoice.created", "invoice.sent", "payment.received"],
    "Sales Events": ["lead.created", "lead.stage_changed", "proposal.sent"],
    "Scheduled": ["every_day_9am", "every_monday", "weekly_digest"]
};

const ACTION_CATEGORIES = {
    "Notifications": ["notify_user", "notify_team", "notify_manager"],
    "Task Actions": ["create_task", "update_task_status", "assign_user_to_task"],
    "Client Actions": ["send_client_email"],
    "Finance Actions": ["send_invoice_reminder"],
    "Sales Actions": ["send_followup_email", "update_lead_stage"],
    "System Actions": ["log_activity_event"]
};

const AutomationBuilder = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'enabled',
        trigger: { type: '', category: '' },
        conditions: [],
        actions: []
    });

    useEffect(() => {
        if (id) {
            const fetchAutomation = async () => {
                const docRef = doc(db, 'automations', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setFormData(docSnap.data());
                }
            };
            fetchAutomation();
        }
    }, [id]);

    const handleSave = async () => {
        if (!formData.name || !formData.trigger.type) {
            alert("Please provide a name and select a trigger.");
            return;
        }

        setLoading(true);
        try {
            const data = {
                ...formData,
                companyId: currentUser.companyId,
                updatedAt: serverTimestamp(),
                ownerId: currentUser?.uid
            };

            if (id) {
                await updateDoc(doc(db, 'automations', id), data);
            } else {
                data.createdAt = serverTimestamp();
                await setDoc(doc(collection(db, 'automations')), data);
            }
            navigate('/app/automation');
        } catch (error) {
            console.error("Error saving automation:", error);
            alert("Failed to save automation.");
        } finally {
            setLoading(false);
        }
    };

    const addCondition = () => {
        setFormData(prev => ({
            ...prev,
            conditions: [...prev.conditions, { field: '', operator: '==', value: '' }]
        }));
    };

    const updateCondition = (index, field, value) => {
        const newConditions = [...formData.conditions];
        newConditions[index] = { ...newConditions[index], [field]: value };
        setFormData(prev => ({ ...prev, conditions: newConditions }));
    };

    const removeCondition = (index) => {
        setFormData(prev => ({
            ...prev,
            conditions: prev.conditions.filter((_, i) => i !== index)
        }));
    };

    const addAction = () => {
        setFormData(prev => ({
            ...prev,
            actions: [...prev.actions, { actionType: '', params: {} }]
        }));
    };

    const updateAction = (index, field, value) => {
        const newActions = [...formData.actions];
        newActions[index] = { ...newActions[index], [field]: value };
        setFormData(prev => ({ ...prev, actions: newActions }));
    };

    const removeAction = (index) => {
        setFormData(prev => ({
            ...prev,
            actions: prev.actions.filter((_, i) => i !== index)
        }));
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6 pb-20">
                <div className="mb-6">
                    <h1 className="text-h1 font-bold text-text-primary">{id ? "Edit Automation" : "Create Automation"}</h1>
                    <p className="text-text-secondary">Configure your automation rules.</p>
                </div>

                {/* Header Actions */}
                <div className="flex justify-between items-center bg-surface p-4 rounded-lg border border-border sticky top-0 z-10 shadow-sm">
                    <h2 className="text-lg font-bold text-text-primary">{formData.name || 'Untitled Automation'}</h2>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={() => navigate('/app/automation')}>Cancel</Button>
                        <Button onClick={handleSave} isLoading={loading}>Save Automation</Button>
                    </div>
                </div>

                {/* Details Section */}
                <div className="bg-surface p-6 rounded-lg border border-border space-y-4">
                    <h3 className="font-bold text-text-primary flex items-center gap-2">
                        <Icon name="Settings" size={18} /> Automation Details
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                            <input
                                type="text"
                                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Notify manager on high priority task"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                            <textarea
                                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary h-20 resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe what this automation does..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                            <select
                                className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="enabled">Enabled</option>
                                <option value="disabled">Disabled</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Trigger Section */}
                <div className="bg-surface p-6 rounded-lg border border-border space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <h3 className="font-bold text-text-primary flex items-center gap-2">
                        <Icon name="Zap" size={18} className="text-blue-500" /> Trigger
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
                            <select
                                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                value={formData.trigger.category}
                                onChange={(e) => setFormData({ ...formData, trigger: { category: e.target.value, type: '' } })}
                            >
                                <option value="">Select Category</option>
                                {Object.keys(TRIGGER_CATEGORIES).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Event</label>
                            <select
                                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                value={formData.trigger.type}
                                onChange={(e) => setFormData({ ...formData, trigger: { ...formData.trigger, type: e.target.value } })}
                                disabled={!formData.trigger.category}
                            >
                                <option value="">Select Event</option>
                                {formData.trigger.category && TRIGGER_CATEGORIES[formData.trigger.category].map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Conditions Section */}
                <div className="bg-surface p-6 rounded-lg border border-border space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-text-primary flex items-center gap-2">
                            <Icon name="Filter" size={18} className="text-yellow-500" /> Conditions (Optional)
                        </h3>
                        <Button size="sm" variant="ghost" onClick={addCondition}>
                            <Icon name="Plus" size={14} className="mr-1" /> Add Condition
                        </Button>
                    </div>

                    {formData.conditions.length === 0 && (
                        <p className="text-sm text-text-secondary italic">No conditions set. Actions will run immediately after trigger.</p>
                    )}

                    <div className="space-y-3">
                        {formData.conditions.map((condition, index) => (
                            <div key={index} className="flex gap-3 items-center bg-background p-3 rounded border border-border">
                                <input
                                    type="text"
                                    placeholder="Field (e.g. priority)"
                                    className="flex-1 bg-surface border border-border rounded px-3 py-1.5 text-sm"
                                    value={condition.field}
                                    onChange={(e) => updateCondition(index, 'field', e.target.value)}
                                />
                                <select
                                    className="w-32 bg-surface border border-border rounded px-3 py-1.5 text-sm"
                                    value={condition.operator}
                                    onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                                >
                                    <option value="==">Equals</option>
                                    <option value="!=">Not Equals</option>
                                    <option value=">">Greater Than</option>
                                    <option value="<">Less Than</option>
                                    <option value="contains">Contains</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Value"
                                    className="flex-1 bg-surface border border-border rounded px-3 py-1.5 text-sm"
                                    value={condition.value}
                                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                                />
                                <button onClick={() => removeCondition(index)} className="text-text-secondary hover:text-danger">
                                    <Icon name="Trash2" size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions Section */}
                <div className="bg-surface p-6 rounded-lg border border-border space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-text-primary flex items-center gap-2">
                            <Icon name="Play" size={18} className="text-green-500" /> Actions
                        </h3>
                        <Button size="sm" variant="ghost" onClick={addAction}>
                            <Icon name="Plus" size={14} className="mr-1" /> Add Action
                        </Button>
                    </div>

                    {formData.actions.length === 0 && (
                        <p className="text-sm text-text-secondary italic">No actions defined.</p>
                    )}

                    <div className="space-y-3">
                        {formData.actions.map((action, index) => (
                            <div key={index} className="bg-background p-3 rounded border border-border space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-text-secondary uppercase">Action {index + 1}</span>
                                    <button onClick={() => removeAction(index)} className="text-text-secondary hover:text-danger">
                                        <Icon name="Trash2" size={16} />
                                    </button>
                                </div>
                                <select
                                    className="w-full bg-surface border border-border rounded px-3 py-2 text-sm"
                                    value={action.actionType}
                                    onChange={(e) => updateAction(index, 'actionType', e.target.value)}
                                >
                                    <option value="">Select Action Type</option>
                                    {Object.entries(ACTION_CATEGORIES).map(([cat, actions]) => (
                                        <optgroup key={cat} label={cat}>
                                            {actions.map(act => (
                                                <option key={act} value={act}>{act}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                                {/* Placeholder for params - could be dynamic based on action type */}
                                {action.actionType && (
                                    <div className="text-xs text-text-secondary p-2 bg-surface-secondary rounded">
                                        Parameters configuration for <b>{action.actionType}</b> would go here.
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AutomationBuilder;
