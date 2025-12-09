import React, { useState } from 'react';
import ThreePaneLayout from '../components/layout/ThreePaneLayout';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import FinanceDashboard from '../components/finance/FinanceDashboard';
import InvoicesList from '../components/finance/InvoicesList';
import ExpensesList from '../components/finance/ExpensesList';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

import { useNavigate } from 'react-router-dom';

const Finance = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [exporting, setExporting] = useState(false);

    const handleExportReport = async () => {
        setExporting(true);
        try {
            const invoicesSnap = await getDocs(collection(db, 'invoices'));
            const expensesSnap = await getDocs(collection(db, 'expenses'));

            const invoices = invoicesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const expenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Flatten Invoices: One row per line item
            const invoiceRows = invoices.flatMap(inv => {
                const issueDate = inv.issueDate || inv.createdAt?.toDate().toISOString().split('T')[0] || '';
                const dueDate = inv.dueDate || '';

                // If line items exist, map them
                if (inv.lineItems && inv.lineItems.length > 0) {
                    return inv.lineItems.map(item => ({
                        Date: ` ${issueDate}`, // Prepend space
                        Type: 'Invoice',
                        Reference: inv.invoiceNumber,
                        Description: item.description,
                        Category: 'Sales',
                        Amount: item.total?.toFixed(2),
                        Status: inv.status,
                        DueDate: ` ${dueDate}` // Prepend space
                    }));
                }
                // Fallback if no line items
                return [{
                    Date: ` ${issueDate}`,
                    Type: 'Invoice',
                    Reference: inv.invoiceNumber,
                    Description: 'Invoice Total',
                    Category: 'Sales',
                    Amount: inv.total?.toFixed(2),
                    Status: inv.status,
                    DueDate: ` ${dueDate}`
                }];
            });

            // Map Expenses
            const expenseRows = expenses.map(exp => {
                const date = exp.date || exp.createdAt?.toDate().toISOString().split('T')[0] || '';
                return {
                    Date: ` ${date}`, // Prepend space
                    Type: 'Expense',
                    Reference: exp.id.substring(0, 8), // Short ID
                    Description: exp.description,
                    Category: exp.category || 'Expense',
                    Amount: `-${parseFloat(exp.amount).toFixed(2)}`, // Negative for expense
                    Status: 'Paid',
                    DueDate: ''
                };
            });

            const allRows = [...invoiceRows, ...expenseRows].sort((a, b) => new Date(b.Date.trim()) - new Date(a.Date.trim()));

            const headers = ["Date", "Type", "Reference", "Description", "Category", "Amount", "Status", "Due Date"];

            const csvContent = [
                headers.join(","),
                ...allRows.map(row => [
                    row.Date,
                    row.Type,
                    row.Reference,
                    `"${(row.Description || '').replace(/"/g, '""')}"`, // Escape quotes
                    row.Category,
                    row.Amount,
                    row.Status,
                    row.DueDate
                ].join(","))
            ].join("\n");

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `finance_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error exporting report:", error);
            alert("Failed to export report.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <ThreePaneLayout>
            <div className="flex flex-col h-full bg-background">
                {/* Header */}
                <div className="bg-surface border-b border-border p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-h2 font-bold text-text-primary">Finance</h1>
                            <p className="text-text-secondary">Manage invoices, expenses, and track financial health.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="secondary" onClick={handleExportReport} disabled={exporting}>
                                <Icon name="Download" size={16} className="mr-2" />
                                {exporting ? 'Exporting...' : 'Export Report'}
                            </Button>
                            <Button onClick={() => navigate('/app/finance/invoices/new')}>
                                <Icon name="Plus" size={16} className="mr-2" /> New Invoice
                            </Button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-6">
                        {[
                            { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
                            { id: 'invoices', label: 'Invoices', icon: 'FileText' },
                            { id: 'expenses', label: 'Expenses', icon: 'Receipt' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-primary text-primary font-medium'
                                    : 'border-transparent text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                <Icon name={tab.icon} size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-surface-secondary/30 p-6">
                    {activeTab === 'dashboard' && <FinanceDashboard />}
                    {activeTab === 'invoices' && <InvoicesList />}
                    {activeTab === 'expenses' && <ExpensesList />}
                </div>
            </div>
        </ThreePaneLayout>
    );
};

export default Finance;
