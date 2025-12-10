import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../ui/Icon';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../hooks/useCurrency';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, Cell
} from 'recharts';

const KPICard = ({ label, value, trend, trendValue, icon, color }) => (
    <div className="bg-surface p-6 rounded-lg border border-border">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-md ${color === 'primary' ? 'bg-primary/10 text-primary' : color === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                <Icon name={icon} size={20} />
            </div>
            {trend && (
                <div className={`flex items-center text-xs font-medium ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
                    <Icon name={trend === 'up' ? 'TrendingUp' : 'TrendingDown'} size={14} className="mr-1" />
                    {trendValue}
                </div>
            )}
        </div>
        <h3 className="text-text-secondary text-sm font-medium mb-1">{label}</h3>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
    </div>
);

const FinanceDashboard = () => {
    const { currentUser } = useAuth();
    const { formatCurrency, convertAmount, currency } = useCurrency();
    const [stats, setStats] = useState({
        revenue: 0,
        expenses: 0,
        profit: 0,
        overdue: 0,
        overdueCount: 0
    });
    const [invoices, setInvoices] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [projects, setProjects] = useState({});

    useEffect(() => {
        if (!currentUser?.companyId) return;

        // Fetch Projects
        const qProjects = query(collection(db, 'projects'), where('companyId', '==', currentUser.companyId));
        const unsubscribeProjects = onSnapshot(qProjects, (snapshot) => {
            const projMap = {};
            snapshot.docs.forEach(doc => {
                projMap[doc.id] = doc.data().name;
            });
            setProjects(projMap);
        });

        // Fetch Invoices
        const qInvoices = query(collection(db, 'invoices'), where('companyId', '==', currentUser.companyId));
        const unsubscribeInvoices = onSnapshot(qInvoices, (snapshot) => {
            const loadedInvoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Client-side sort
            loadedInvoices.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });
            setInvoices(loadedInvoices);
        });

        // Fetch Expenses
        const qExpenses = query(collection(db, 'expenses'), where('companyId', '==', currentUser.companyId));
        const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
            const loadedExpenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Client-side sort
            loadedExpenses.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });
            setExpenses(loadedExpenses);
        });

        return () => {
            unsubscribeProjects();
            unsubscribeInvoices();
            unsubscribeExpenses();
        };
    }, [currentUser]);

    // Calculate Stats whenever data or currency changes
    useEffect(() => {
        let revenue = 0;
        let overdue = 0;
        let overdueCount = 0;
        let expensesTotal = 0;

        invoices.forEach(inv => {
            const amount = convertAmount(inv.total, inv.currency); // Convert if needed
            if (inv.status === 'Paid') {
                revenue += amount;
            } else if (inv.status === 'Overdue') {
                overdue += amount;
                overdueCount++;
            }
        });

        expenses.forEach(exp => {
            const amount = convertAmount(exp.amount, exp.currency); // Convert
            expensesTotal += amount;
        });

        setStats({
            revenue,
            expenses: expensesTotal,
            profit: revenue - expensesTotal,
            overdue,
            overdueCount
        });
    }, [invoices, expenses, currency]); // Re-run when currency changes!

    const recentTransactions = expenses.slice(0, 5);
    const upcomingPayments = invoices.filter(i => i.status !== 'Paid' && i.status !== 'Draft').slice(0, 5);

    // --- Chart Data Processing ---

    // 1. Revenue vs Expenses (Monthly)
    const financialHistory = useMemo(() => {
        const dataMap = {};

        // Process Revenue (Paid Invoices)
        invoices.forEach(inv => {
            if (inv.status === 'Paid') {
                const date = inv.updatedAt?.seconds ? new Date(inv.updatedAt.seconds * 1000) : new Date(inv.createdAt?.seconds * 1000 || Date.now());
                const month = date.toLocaleString('default', { month: 'short' });
                const sortKey = date.getFullYear() * 100 + date.getMonth();
                const amount = convertAmount(inv.total, inv.currency);

                if (!dataMap[month]) dataMap[month] = { name: month, revenue: 0, expenses: 0, sortKey };
                dataMap[month].revenue += amount;
            }
        });

        // Process Expenses
        expenses.forEach(exp => {
            const date = exp.createdAt?.seconds ? new Date(exp.createdAt.seconds * 1000) : new Date();
            const month = date.toLocaleString('default', { month: 'short' });
            const sortKey = date.getFullYear() * 100 + date.getMonth();
            const amount = convertAmount(exp.amount, exp.currency);

            if (!dataMap[month]) dataMap[month] = { name: month, revenue: 0, expenses: 0, sortKey };
            dataMap[month].expenses += amount;
        });

        return Object.values(dataMap).sort((a, b) => a.sortKey - b.sortKey);
    }, [invoices, expenses, currency]);

    // 2. Profitability by Project
    const projectProfitability = useMemo(() => {
        const projStats = {};

        invoices.forEach(inv => {
            if (inv.status === 'Paid' && inv.projectId) {
                const pId = inv.projectId;
                if (!projStats[pId]) projStats[pId] = { name: projects[pId] || 'Unknown Project', revenue: 0 };
                projStats[pId].revenue += convertAmount(inv.total, inv.currency);
            }
        });

        expenses.forEach(exp => {
            if (exp.projectId) {
                const pId = exp.projectId;
                if (!projStats[pId]) projStats[pId] = { name: projects[pId] || 'Unknown Project', revenue: 0, expenses: 0 };
                if (!projStats[pId].expenses) projStats[pId].expenses = 0;
                projStats[pId].expenses += convertAmount(exp.amount, exp.currency);
            }
        });

        return Object.keys(projStats).map(key => ({
            name: projStats[key].name,
            profit: projStats[key].revenue - (projStats[key].expenses || 0),
            revenue: projStats[key].revenue
        })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    }, [invoices, expenses, projects, currency]);


    return (
        <div className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    label="Total Revenue"
                    value={formatCurrency(stats.revenue)}
                    trend="up"
                    trendValue="+0%"
                    icon="DollarSign"
                    color="success"
                />
                <KPICard
                    label="Total Expenses"
                    value={formatCurrency(stats.expenses)}
                    trend="down"
                    trendValue="+0%"
                    icon="CreditCard"
                    color="danger"
                />
                <KPICard
                    label="Net Profit"
                    value={formatCurrency(stats.profit)}
                    trend={stats.profit >= 0 ? "up" : "down"}
                    trendValue="+0%"
                    icon="PieChart"
                    color={stats.profit >= 0 ? "primary" : "danger"}
                />
                <KPICard
                    label="Overdue Invoices"
                    value={formatCurrency(stats.overdue)}
                    trend="down"
                    trendValue={`${stats.overdueCount} Invoices`}
                    icon="AlertCircle"
                    color="danger"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-surface p-6 rounded-lg border border-border">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-text-primary">Revenue vs Expenses</h3>
                    </div>
                    <div className="h-64 w-full text-xs">
                        {financialHistory.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={financialHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="name" stroke="#9ca3af" tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9ca3af" tickLine={false} axisLine={false} tickFormatter={(val) => formatCurrency(val).split('.')[0]} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                        formatter={(value) => [formatCurrency(value), '']}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} name="Revenue" />
                                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} name="Expenses" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-text-secondary bg-surface-secondary/30 rounded border border-dashed border-border">
                                No financial data yet
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-surface p-6 rounded-lg border border-border">
                    <h3 className="font-bold text-lg text-text-primary mb-6">Profitability by Project</h3>
                    <div className="h-64 w-full text-xs">
                        {projectProfitability.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={projectProfitability} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="name" stroke="#9ca3af" tickLine={false} axisLine={false} interval={0} fontSize={10} tick={{ angle: -45, textAnchor: 'end' }} height={60} />
                                    <YAxis stroke="#9ca3af" tickLine={false} axisLine={false} tickFormatter={(val) => formatCurrency(val).split('.')[0]} />
                                    <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px' }} formatter={(value) => [formatCurrency(value), 'Profit']} />
                                    <Bar dataKey="profit" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Profit">
                                        {projectProfitability.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#3b82f6' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-text-secondary bg-surface-secondary/30 rounded border border-dashed border-border">
                                No project data
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Payments */}
                <div className="bg-surface rounded-lg border border-border overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h3 className="font-bold text-lg text-text-primary">Unpaid Invoices</h3>
                    </div>
                    <div className="divide-y divide-border">
                        {upcomingPayments.length === 0 ? (
                            <div className="p-4 text-center text-text-secondary">No unpaid invoices</div>
                        ) : (
                            upcomingPayments.map((invoice) => (
                                <div key={invoice.id} className="p-4 flex items-center justify-between hover:bg-background transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            INV
                                        </div>
                                        <div>
                                            <p className="font-medium text-text-primary">{invoice.invoiceNumber}</p>
                                            <p className="text-xs text-text-secondary">Due {invoice.dueDate}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-text-primary">{formatCurrency(invoice.total, invoice.currency)}</p>
                                        <span className="inline-block px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-medium">{invoice.status}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-surface rounded-lg border border-border overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h3 className="font-bold text-lg text-text-primary">Recent Expenses</h3>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-surface-secondary text-text-secondary font-medium">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Category</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {recentTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="p-4 text-center text-text-secondary">No recent expenses</td>
                                </tr>
                            ) : (
                                recentTransactions.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-background">
                                        <td className="px-6 py-4 text-text-primary">{expense.date}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-full bg-surface-secondary text-xs border border-border">{expense.category}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-text-primary">
                                            {formatCurrency(expense.amount, expense.currency)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinanceDashboard;
