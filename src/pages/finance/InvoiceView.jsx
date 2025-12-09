import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import React, { useState, useEffect } from 'react';
import ThreePaneLayout from '../../components/layout/ThreePaneLayout';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import Badge from '../../components/ui/Badge';

const InvoiceView = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [invoice, setInvoice] = useState(null);
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [projectName, setProjectName] = useState('');
    const [editingStatus, setEditingStatus] = useState(false);

    useEffect(() => {
        const fetchInvoiceData = async () => {
            try {
                const invoiceDoc = await getDoc(doc(db, 'invoices', id));
                if (invoiceDoc.exists()) {
                    const invoiceData = invoiceDoc.data();
                    setInvoice({ id: invoiceDoc.id, ...invoiceData });

                    // Fetch Client
                    if (invoiceData.clientId) {
                        const clientDoc = await getDoc(doc(db, 'clients', invoiceData.clientId));
                        if (clientDoc.exists()) {
                            const data = clientDoc.data();
                            setClientName(data.name);
                            setClientEmail(data.email);
                        }
                    }

                    // Fetch Project
                    if (invoiceData.projectId) {
                        const projectDoc = await getDoc(doc(db, 'projects', invoiceData.projectId));
                        if (projectDoc.exists()) setProjectName(projectDoc.data().name);
                    }
                }
            } catch (error) {
                console.error("Error fetching invoice:", error);
            }
        };
        fetchInvoiceData();
    }, [id]);

    const handleDownload = () => {
        if (!invoice) return;

        // Flatten structure: One row per line item, with repeated invoice details
        // Columns: Invoice #, Client, Issue Date, Due Date, Status, Description, Qty, Unit Price, Line Total

        const headers = ["Invoice #", "Client", "Issue Date", "Due Date", "Status", "Description", "Qty", "Unit Price", "Line Total"];

        const rows = invoice.lineItems.map(item => [
            invoice.invoiceNumber,
            clientName,
            // Ensure date is treated as text or standard format to avoid Excel ########
            ` ${invoice.issueDate}`, // Prepend space to force text
            ` ${invoice.dueDate}`,   // Prepend space to force text
            invoice.status,
            item.description,
            item.quantity,
            item.unitPrice.toFixed(2),
            item.total.toFixed(2)
        ]);

        // Add summary row at the bottom
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

    const handleSend = () => {
        if (!invoice) return;

        // 1. Trigger Download so user has the file
        handleDownload();

        // 2. Open Gmail Compose
        const subject = encodeURIComponent(`Invoice ${invoice.invoiceNumber} from ZHub`);
        // Updated body to prompt user to attach the file
        const body = encodeURIComponent(`Hi ${clientName},\n\nPlease find attached invoice ${invoice.invoiceNumber} for $${invoice.total.toFixed(2)}.\n\n(Please drag the downloaded invoice file here)\n\nThanks,\nZHub Team`);

        // Small timeout to allow download to start
        setTimeout(() => {
            window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${clientEmail || ''}&su=${subject}&body=${body}`, '_blank');
        }, 500);
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) return;
        try {
            await deleteDoc(doc(db, 'invoices', id));
            navigate('/app/finance');
        } catch (error) {
            console.error("Error deleting invoice:", error);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            await updateDoc(doc(db, 'invoices', id), {
                status: newStatus,
                updatedAt: new Date()
            });
            setInvoice(prev => ({ ...prev, status: newStatus }));
            setEditingStatus(false);
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    if (!invoice) return <div className="p-10 text-center">Loading...</div>;

    return (
        <ThreePaneLayout>
            <div className="flex flex-col h-full bg-background">
                {/* Header */}
                <div className="bg-surface border-b border-border p-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/app/finance')}>
                            <Icon name="ArrowLeft" size={20} />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-h2 font-bold text-text-primary">{invoice.invoiceNumber}</h1>
                                {editingStatus ? (
                                    <select
                                        autoFocus
                                        className="p-1 text-xs border rounded bg-background"
                                        value={invoice.status}
                                        onChange={(e) => handleStatusUpdate(e.target.value)}
                                        onBlur={() => setEditingStatus(false)}
                                    >
                                        <option value="Draft">Draft</option>
                                        <option value="Unpaid">Unpaid</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Overdue">Overdue</option>
                                    </select>
                                ) : (
                                    <div onClick={() => setEditingStatus(true)} className="cursor-pointer" title="Click to change status">
                                        <Badge variant={invoice.status === 'Paid' ? 'success' : invoice.status === 'Overdue' ? 'danger' : 'warning'}>
                                            {invoice.status}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                            <p className="text-text-secondary text-sm">Issued on {invoice.issueDate}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={handleDownload}>
                            <Icon name="Download" size={16} className="mr-2" /> Download CSV
                        </Button>
                        <Button variant="secondary" onClick={handleSend}>
                            <Icon name="Send" size={16} className="mr-2" /> Send to Client
                        </Button>
                        <Button variant="secondary" onClick={handleDelete} className="hover:text-danger hover:border-danger">
                            <Icon name="Trash2" size={16} />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto bg-surface rounded-lg border border-border overflow-hidden shadow-sm">

                        {/* Invoice Header Info */}
                        <div className="p-8 border-b border-border grid grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-sm font-bold text-text-secondary uppercase mb-2">Bill To</h3>
                                <p className="text-lg font-bold text-text-primary">{clientName || 'Unknown Client'}</p>
                                <p className="text-text-secondary">123 Business Rd.<br />Tech City, TC 90210</p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-sm font-bold text-text-secondary uppercase mb-2">Details</h3>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-end gap-4">
                                        <span className="text-text-secondary">Project:</span>
                                        <span className="font-medium text-text-primary">{projectName || 'Unknown Project'}</span>
                                    </div>
                                    <div className="flex justify-end gap-4">
                                        <span className="text-text-secondary">Due Date:</span>
                                        <span className="font-medium text-text-primary">{invoice.dueDate}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="p-8">
                            <table className="w-full text-left text-sm mb-8">
                                <thead className="text-text-secondary font-medium border-b border-border">
                                    <tr>
                                        <th className="py-3 w-1/2">Description</th>
                                        <th className="py-3 text-right">Qty</th>
                                        <th className="py-3 text-right">Unit Price</th>
                                        <th className="py-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {invoice.lineItems?.map((item, i) => (
                                        <tr key={i}>
                                            <td className="py-4 text-text-primary font-medium">{item.description}</td>
                                            <td className="py-4 text-right text-text-secondary">{item.quantity}</td>
                                            <td className="py-4 text-right text-text-secondary">${item.unitPrice.toFixed(2)}</td>
                                            <td className="py-4 text-right text-text-primary font-bold">${item.total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals */}
                            <div className="flex justify-end">
                                <div className="w-64 space-y-3">
                                    <div className="flex justify-between text-text-secondary">
                                        <span>Subtotal</span>
                                        <span>${invoice.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-text-secondary">
                                        <span>Tax (0%)</span>
                                        <span>$0.00</span>
                                    </div>
                                    <div className="flex justify-between text-text-secondary">
                                        <span>Discount</span>
                                        <span>-$0.00</span>
                                    </div>
                                    <div className="border-t border-border pt-3 flex justify-between font-bold text-xl text-text-primary">
                                        <span>Total</span>
                                        <span>${invoice.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Notes */}
                        <div className="bg-surface-secondary p-8 border-t border-border">
                            <h4 className="font-bold text-text-primary mb-2">Notes</h4>
                            <p className="text-text-secondary text-sm">{invoice.notes}</p>
                        </div>
                    </div>
                </div>
            </div>
        </ThreePaneLayout>
    );
};

export default InvoiceView;
