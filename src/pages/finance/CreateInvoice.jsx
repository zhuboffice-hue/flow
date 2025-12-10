import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThreePaneLayout from '../../components/layout/ThreePaneLayout';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import Input from '../../components/ui/Input'; // Assuming we have this, or use standard input
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

const CreateInvoice = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);

    const [formData, setFormData] = useState({
        clientId: '',
        projectId: '',
        invoiceNumber: 'INV-' + Date.now().toString().slice(-6),
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        lineItems: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
        taxPercentage: 0,
        discount: 0,
        notes: '',
        status: 'Draft'
    });

    useEffect(() => {
        if (!currentUser?.companyId) return;

        // Fetch clients and projects
        const fetchData = async () => {
            try {
                const clientsQ = query(collection(db, 'clients'), where('companyId', '==', currentUser.companyId));
                const clientsSnapshot = await getDocs(clientsQ);
                setClients(clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                const projectsQ = query(collection(db, 'projects'), where('companyId', '==', currentUser.companyId));
                const projectsSnapshot = await getDocs(projectsQ);
                setProjects(projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, [currentUser]);

    const handleLineItemChange = (index, field, value) => {
        const newLineItems = [...formData.lineItems];
        newLineItems[index][field] = value;

        // Recalculate total
        if (field === 'quantity' || field === 'unitPrice') {
            newLineItems[index].total = newLineItems[index].quantity * newLineItems[index].unitPrice;
        }

        setFormData({ ...formData, lineItems: newLineItems });
    };

    const addLineItem = () => {
        setFormData({
            ...formData,
            lineItems: [...formData.lineItems, { description: '', quantity: 1, unitPrice: 0, total: 0 }]
        });
    };

    const removeLineItem = (index) => {
        const newLineItems = formData.lineItems.filter((_, i) => i !== index);
        setFormData({ ...formData, lineItems: newLineItems });
    };

    const calculateSubtotal = () => {
        return formData.lineItems.reduce((sum, item) => sum + item.total, 0);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const taxAmount = subtotal * (formData.taxPercentage / 100);
        const discountAmount = formData.discount;
        return subtotal + taxAmount - discountAmount;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const invoiceData = {
                ...formData,
                companyId: currentUser.companyId,
                subtotal: calculateSubtotal(),
                total: calculateTotal(),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await addDoc(collection(db, 'invoices'), invoiceData);
            console.log("Invoice created:", invoiceData);
            navigate('/app/finance');
        } catch (error) {
            console.error("Error creating invoice:", error);
            // Ideally show a toast notification here
        }
    };

    return (
        <ThreePaneLayout>
            <div className="flex flex-col h-full bg-background">
                {/* Header */}
                <div className="bg-surface border-b border-border p-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/app/finance')}>
                            <Icon name="ArrowLeft" size={20} />
                        </Button>
                        <h1 className="text-h2 font-bold text-text-primary">Create Invoice</h1>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => navigate('/app/finance')}>Cancel</Button>
                        <Button onClick={handleSubmit}>Save Invoice</Button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto space-y-8">

                        {/* Basic Info */}
                        <div className="bg-surface p-6 rounded-lg border border-border grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Client</label>
                                <select
                                    className="w-full p-2 bg-background border border-border rounded-md"
                                    value={formData.clientId}
                                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                >
                                    <option value="">Select Client</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Project</label>
                                <select
                                    className="w-full p-2 bg-background border border-border rounded-md"
                                    value={formData.projectId}
                                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                >
                                    <option value="">Select Project</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Invoice Number</label>
                                <input
                                    type="text"
                                    className="w-full p-2 bg-background border border-border rounded-md"
                                    value={formData.invoiceNumber}
                                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Issue Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 bg-background border border-border rounded-md"
                                        value={formData.issueDate}
                                        onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 bg-background border border-border rounded-md"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="bg-surface p-6 rounded-lg border border-border">
                            <h3 className="font-bold text-lg text-text-primary mb-4">Line Items</h3>
                            <div className="space-y-4">
                                {formData.lineItems.map((item, index) => (
                                    <div key={index} className="flex gap-4 items-start">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                placeholder="Description"
                                                className="w-full p-2 bg-background border border-border rounded-md"
                                                value={item.description}
                                                onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                                            />
                                        </div>
                                        <div className="w-20">
                                            <input
                                                type="number"
                                                placeholder="Qty"
                                                className="w-full p-2 bg-background border border-border rounded-md"
                                                value={item.quantity}
                                                onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="w-32">
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                className="w-full p-2 bg-background border border-border rounded-md"
                                                value={item.unitPrice}
                                                onChange={(e) => handleLineItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="w-32 p-2 text-right font-medium text-text-primary">
                                            ${item.total.toFixed(2)}
                                        </div>
                                        <button
                                            onClick={() => removeLineItem(index)}
                                            className="p-2 text-text-secondary hover:text-danger transition-colors"
                                        >
                                            <Icon name="Trash2" size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <Button variant="secondary" className="mt-4" onClick={addLineItem}>
                                <Icon name="Plus" size={16} className="mr-2" /> Add Item
                            </Button>
                        </div>

                        {/* Totals & Notes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-surface p-6 rounded-lg border border-border">
                                <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
                                <textarea
                                    className="w-full p-2 bg-background border border-border rounded-md h-32 resize-none"
                                    placeholder="Additional notes for the client..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="bg-surface p-6 rounded-lg border border-border space-y-3">
                                <div className="flex justify-between text-text-secondary">
                                    <span>Subtotal</span>
                                    <span>${calculateSubtotal().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-text-secondary">Tax (%)</span>
                                    <input
                                        type="number"
                                        className="w-20 p-1 bg-background border border-border rounded text-right"
                                        value={formData.taxPercentage}
                                        onChange={(e) => setFormData({ ...formData, taxPercentage: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-text-secondary">Discount ($)</span>
                                    <input
                                        type="number"
                                        className="w-20 p-1 bg-background border border-border rounded text-right"
                                        value={formData.discount}
                                        onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="border-t border-border pt-3 flex justify-between font-bold text-lg text-text-primary">
                                    <span>Total</span>
                                    <span>${calculateTotal().toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </ThreePaneLayout>
    );
};

export default CreateInvoice;
