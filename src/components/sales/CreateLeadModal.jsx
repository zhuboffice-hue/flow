import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useCurrency } from '../../hooks/useCurrency';
import { CURRENCY_OPTIONS } from '../../lib/models';

const CreateLeadModal = ({ isOpen, onClose, onSave, employees = [], initialStage = 'new' }) => {
    const { currentUser } = useAuth();
    const { currency: companyCurrency, getCurrencySymbol } = useCurrency();
    const [loading, setLoading] = useState(false);

    // Initial State
    const initialFormState = {
        name: '',
        company: '',
        email: '',
        phone: '',
        source: 'Website',
        value: '',
        currency: 'USD',
        status: 'New Lead', // This seems to be a display status, separate from 'stage'
        assigneeId: ''
    };

    const [formData, setFormData] = useState(initialFormState);

    // Reset and set defaults when opening
    useEffect(() => {
        if (isOpen) {
            setFormData({
                ...initialFormState,
                currency: companyCurrency, // Default to company currency
                // We don't set 'stage' in formData here because the parent handles the creation logic
                // But we might want to pass it back if the form allowed changing it.
                // For now, we'll assume the parent knows the stage if passed via initialStage,
                // or we can add it to formData if we want the user to pick it (optional).
            });
        }
    }, [isOpen, companyCurrency]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Pass data to parent. Parent handles DB interaction.
            await onSave({
                ...formData,
                stage: initialStage // Pass the stage context back
            });

            // onSave expected to handle closing if successful, or we close here?
            // Usually parent closes modal on success. But relying on parent's state update is safer.
            // For now, let's assume onSave returns promise.
            onClose();
        } catch (error) {
            console.error("Error creating lead:", error);
            // alert("Failed to create lead"); // Let parent handle errors usually, or show UI error
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Helper to get selected currency symbol
    const selectedCurrencySymbol = CURRENCY_OPTIONS.find(c => c.value === formData.currency)?.symbol || '$';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-md border border-border">
                <div className="flex justify-between items-center p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-text-primary">New Lead</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                        <Icon name="X" size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <Input
                        label="Contact Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. John Doe"
                    />
                    <Input
                        label="Company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Acme Corp"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john@example.com"
                        />
                        <Input
                            label="Phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Source</label>
                            <select
                                name="source"
                                value={formData.source}
                                onChange={handleChange}
                                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary text-text-primary"
                            >
                                <option>Website</option>
                                <option>Referral</option>
                                <option>Cold Call</option>
                                <option>LinkedIn</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-1/2">
                                <label className="block text-sm font-medium text-text-secondary mb-1">Value</label>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary text-sm">{selectedCurrencySymbol}</span>
                                    <input
                                        name="value"
                                        value={formData.value}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-border rounded-md pl-6 pr-2 py-2 text-sm focus:outline-none focus:border-primary text-text-primary"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="w-1/2">
                                <label className="block text-sm font-medium text-text-secondary mb-1">Currency</label>
                                <select
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleChange}
                                    className="w-full bg-background border border-border rounded-md px-2 py-2 text-sm focus:outline-none focus:border-primary text-text-primary"
                                >
                                    {CURRENCY_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Assignee</label>
                        <select
                            name="assigneeId"
                            value={formData.assigneeId}
                            onChange={handleChange}
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary text-text-primary"
                        >
                            <option value="">Unassigned</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Lead'}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateLeadModal;
