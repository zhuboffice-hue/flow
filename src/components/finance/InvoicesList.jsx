import { collection, onSnapshot, query, orderBy, updateDoc, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import Badge from '../ui/Badge';

const InvoicesList = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [filterStatus, setFilterStatus] = useState('All');
    const [editingStatusId, setEditingStatusId] = useState(null); // ID of invoice whose status is being edited

    const [invoices, setInvoices] = useState([]);
    const [clients, setClients] = useState({});
    const [projects, setProjects] = useState({});

    useEffect(() => {
        if (!currentUser?.companyId) return;

        // Fetch Invoices
        const q = query(collection(db, 'invoices'), where('companyId', '==', currentUser.companyId));
        const unsubscribeInvoices = onSnapshot(q, (snapshot) => {
            const invoicesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Client-side sort
            invoicesData.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA; // Descending
            });
            setInvoices(invoicesData);
        });

        // Fetch Clients
        // Fetch Clients
        const qClients = query(collection(db, 'clients'), where('companyId', '==', currentUser.companyId));
        const unsubscribeClients = onSnapshot(qClients, (snapshot) => {
            const clientsMap = {};
            snapshot.docs.forEach(doc => {
                clientsMap[doc.id] = doc.data().name;
            });
            setClients(clientsMap);
        });

        // Fetch Projects
        // Fetch Projects
        const qProjects = query(collection(db, 'projects'), where('companyId', '==', currentUser.companyId));
        const unsubscribeProjects = onSnapshot(qProjects, (snapshot) => {
            const projectsMap = {};
            snapshot.docs.forEach(doc => {
                projectsMap[doc.id] = doc.data().name;
            });
            setProjects(projectsMap);
        });

        return () => {
            unsubscribeInvoices();
            unsubscribeClients();
            unsubscribeProjects();
        };
    }, [currentUser]);

    const handleStatusUpdate = async (invoiceId, newStatus) => {
        try {
            await updateDoc(doc(db, 'invoices', invoiceId), {
                status: newStatus,
                updatedAt: new Date()
            });
            setEditingStatusId(null);
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleDelete = async (invoiceId) => {
        if (!window.confirm("Are you sure you want to delete this invoice?")) return;
        try {
            await deleteDoc(doc(db, 'invoices', invoiceId));
        } catch (error) {
            console.error("Error deleting invoice:", error);
        }
    };

    const handleDownload = (invoice) => {
        // Flatten structure: One row per line item
        const headers = ["Invoice #", "Client", "Issue Date", "Due Date", "Status", "Description", "Qty", "Unit Price", "Line Total"];

        const rows = invoice.lineItems.map(item => [
            invoice.invoiceNumber,
            clients[invoice.clientId] || 'Unknown Client',
            ` ${invoice.issueDate}`, // Prepend space for Excel
            ` ${invoice.dueDate}`,   // Prepend space for Excel
            invoice.status,
            item.description,
            item.quantity,
            item.unitPrice.toFixed(2),
            item.total.toFixed(2)
        ]);

        rows.push(["", "", "", "", "TOTAL", "", "", "", invoice.total.toFixed(2)]);

        const csvContent = [
            headers.join(","),
            ...rows.map(e => e.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${invoice.invoiceNumber}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredInvoices = filterStatus === 'All'
        ? invoices
        : invoices.filter(inv => inv.status === filterStatus);

    return (
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
            {/* Header / Filters */}
            <div className="p-4 border-b border-border flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    {['All', 'Paid', 'Unpaid', 'Overdue', 'Draft'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === status
                                ? 'bg-primary text-white'
                                : 'bg-surface-secondary text-text-secondary hover:bg-surface-hover'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Search invoices..."
                            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-primary"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-surface-secondary text-text-secondary font-medium border-b border-border">
                        <tr>
                            <th className="px-6 py-3">Invoice #</th>
                            <th className="px-6 py-3">Client</th>
                            <th className="px-6 py-3">Project</th>
                            <th className="px-6 py-3">Issue Date</th>
                            <th className="px-6 py-3">Due Date</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredInvoices.map(invoice => (
                            <tr key={invoice.id} className="hover:bg-background transition-colors">
                                <td className="px-6 py-4 font-medium text-text-primary">{invoice.invoiceNumber}</td>
                                <td className="px-6 py-4 text-text-primary">{clients[invoice.clientId] || 'Unknown Client'}</td>
                                <td className="px-6 py-4 text-text-secondary">{projects[invoice.projectId] || 'Unknown Project'}</td>
                                <td className="px-6 py-4 text-text-secondary">{invoice.issueDate}</td>
                                <td className="px-6 py-4 text-text-secondary">{invoice.dueDate}</td>
                                <td className="px-6 py-4 font-medium text-text-primary">${invoice.total?.toFixed(2)}</td>
                                <td className="px-6 py-4">
                                    {editingStatusId === invoice.id ? (
                                        <select
                                            autoFocus
                                            className="p-1 text-xs border rounded bg-background"
                                            value={invoice.status}
                                            onChange={(e) => handleStatusUpdate(invoice.id, e.target.value)}
                                            onBlur={() => setEditingStatusId(null)}
                                        >
                                            <option value="Draft">Draft</option>
                                            <option value="Unpaid">Unpaid</option>
                                            <option value="Paid">Paid</option>
                                            <option value="Overdue">Overdue</option>
                                        </select>
                                    ) : (
                                        <div onClick={() => setEditingStatusId(invoice.id)} className="cursor-pointer">
                                            <Badge variant={
                                                invoice.status === 'Paid' ? 'success' :
                                                    invoice.status === 'Overdue' ? 'danger' :
                                                        invoice.status === 'Unpaid' ? 'warning' : 'secondary'
                                            }>
                                                {invoice.status}
                                            </Badge>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" title="View" onClick={() => navigate(`/app/finance/invoices/${invoice.id}`)}>
                                            <Icon name="Eye" size={16} />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Download CSV" onClick={() => handleDownload(invoice)}>
                                            <Icon name="Download" size={16} />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(invoice.id)}>
                                            <Icon name="Trash2" size={16} className="text-danger" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination (Placeholder) */}
            <div className="p-4 border-t border-border flex justify-between items-center text-sm text-text-secondary">
                <span>Showing {filteredInvoices.length} of {invoices.length} invoices</span>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" disabled>Previous</Button>
                    <Button variant="secondary" size="sm" disabled>Next</Button>
                </div>
            </div>
        </div>
    );
};

export default InvoicesList;
