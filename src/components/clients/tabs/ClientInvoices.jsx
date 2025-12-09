import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Table from '../../ui/Table';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';
import Icon from '../../ui/Icon';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Select from '../../ui/Select';

const ClientInvoices = ({ clientId }) => {
    const [invoices, setInvoices] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newInvoice, setNewInvoice] = useState({
        amount: '',
        date: '',
        dueDate: '',
        status: 'Unpaid',
        project: ''
    });

    useEffect(() => {
        if (!clientId) return;

        const q = query(collection(db, 'invoices'), where('clientId', '==', clientId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const invoicesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setInvoices(invoicesData);
        });
        return () => unsubscribe();
    }, [clientId]);

    const handleCreateInvoice = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'invoices'), {
                ...newInvoice,
                clientId,
                createdAt: new Date()
            });
            setIsModalOpen(false);
            setNewInvoice({ amount: '', date: '', dueDate: '', status: 'Unpaid', project: '' });
        } catch (error) {
            console.error("Error creating invoice:", error);
        }
    };

    const columns = [
        { key: 'id', header: 'Invoice ID', accessor: 'id', cell: (row) => <span className="font-medium text-xs">{row.id.slice(0, 8)}</span> },
        { key: 'project', header: 'Project', accessor: 'project' },
        { key: 'amount', header: 'Amount', accessor: 'amount' },
        { key: 'date', header: 'Issue Date', accessor: 'date' },
        { key: 'dueDate', header: 'Due Date', accessor: 'dueDate' },
        {
            key: 'status',
            header: 'Status',
            accessor: 'status',
            cell: (row) => (
                <Badge variant={row.status === 'Paid' ? 'success' : 'danger'}>{row.status}</Badge>
            )
        },
        {
            key: 'actions',
            header: '',
            accessor: 'actions',
            cell: () => (
                <Button variant="ghost" size="icon"><Icon name="Download" size={16} /></Button>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-text-primary">Invoices</h3>
                <Button size="sm" onClick={() => setIsModalOpen(true)}><Icon name="Plus" size={14} className="mr-2" /> Create Invoice</Button>
            </div>

            {invoices.length === 0 ? (
                <div className="text-center py-8 text-text-secondary bg-surface rounded-lg border border-border">
                    <p>No invoices found for this client.</p>
                </div>
            ) : (
                <div className="bg-surface rounded-lg border border-border overflow-hidden">
                    <Table data={invoices} columns={columns} />
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New Invoice"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateInvoice}>Create Invoice</Button>
                    </div>
                }
            >
                <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Amount"
                            value={newInvoice.amount}
                            onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                            required
                        />
                        <Input
                            label="Project Name"
                            value={newInvoice.project}
                            onChange={(e) => setNewInvoice({ ...newInvoice, project: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Issue Date"
                            type="date"
                            value={newInvoice.date}
                            onChange={(e) => setNewInvoice({ ...newInvoice, date: e.target.value })}
                            required
                        />
                        <Input
                            label="Due Date"
                            type="date"
                            value={newInvoice.dueDate}
                            onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                            required
                        />
                    </div>
                    <Select
                        label="Status"
                        value={newInvoice.status}
                        onChange={(e) => setNewInvoice({ ...newInvoice, status: e.target.value })}
                        options={[
                            { value: 'Unpaid', label: 'Unpaid' },
                            { value: 'Paid', label: 'Paid' },
                            { value: 'Overdue', label: 'Overdue' }
                        ]}
                    />
                </form>
            </Modal>
        </div>
    );
};

export default ClientInvoices;
