import React, { useState, useEffect } from 'react';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useCurrency } from '../../hooks/useCurrency';
import { CURRENCY_OPTIONS } from '../../lib/models';

const AddExpenseModal = ({ isOpen, onClose }) => {
    const { currency: companyCurrency, getCurrencySymbol } = useCurrency();
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        category: 'Software',
        amount: '',
        currency: 'USD',
        vendor: '',
        projectId: '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({ ...prev, currency: companyCurrency }));
        }
    }, [isOpen, companyCurrency]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const expenseData = {
                ...formData,
                createdAt: new Date()
            };
            await addDoc(collection(db, 'expenses'), expenseData);
            console.log("Expense added:", expenseData);
            onClose();
            // Reset form (optional, or rely on useEffect on next open)
        } catch (error) {
            console.error("Error adding expense:", error);
        }
    };

    const selectedCurrencySymbol = CURRENCY_OPTIONS.find(c => c.value === formData.currency)?.symbol || '$';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-surface w-full max-w-md rounded-lg shadow-xl border border-border flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-text-primary">Add Expense</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                        <Icon name="X" size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form id="add-expense-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Date</label>
                            <input
                                type="date"
                                className="w-full p-2 bg-background border border-border rounded-md"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
                            <select
                                className="w-full p-2 bg-background border border-border rounded-md"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option>Software</option>
                                <option>Advertising</option>
                                <option>Travel</option>
                                <option>Contractors</option>
                                <option>Supplies</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-1/2">
                                <label className="block text-sm font-medium text-text-secondary mb-1">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                                        {selectedCurrencySymbol}
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full pl-8 pr-4 py-2 bg-background border border-border rounded-md"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || '' })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="w-1/2">
                                <label className="block text-sm font-medium text-text-secondary mb-1">Currency</label>
                                <select
                                    className="w-full p-2 bg-background border border-border rounded-md"
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                >
                                    {CURRENCY_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Vendor</label>
                            <input
                                type="text"
                                className="w-full p-2 bg-background border border-border rounded-md"
                                value={formData.vendor}
                                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                                required
                            />
                        </div>
                        {/* ... Rest of the form ... */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Linked Project (Optional)</label>
                            <select
                                className="w-full p-2 bg-background border border-border rounded-md"
                                value={formData.projectId}
                                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                            >
                                <option value="">None</option>
                                <option value="1">Website Redesign</option>
                                <option value="2">Mobile App</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
                            <textarea
                                className="w-full p-2 bg-background border border-border rounded-md h-24 resize-none"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            ></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Receipt</label>
                            <div className="border-2 border-dashed border-border rounded-md p-4 text-center cursor-pointer hover:bg-surface-secondary transition-colors">
                                <Icon name="UploadCloud" size={24} className="mx-auto text-text-secondary mb-2" />
                                <p className="text-xs text-text-secondary">Click to upload receipt</p>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-border flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="add-expense-form">Add Expense</Button>
                </div>
            </div>
        </div>
    );
};

export default AddExpenseModal;
