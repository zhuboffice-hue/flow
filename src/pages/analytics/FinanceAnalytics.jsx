import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/ThreePaneLayout';
import Icon from '../../components/ui/Icon';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useCurrency } from '../../hooks/useCurrency';

const KPICard = ({ title, value, change, trend, icon, color }) => (
    <div className="bg-surface p-6 rounded-lg border border-border">
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-text-secondary text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-text-primary mt-1">{value}</h3>
            </div>
            <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
                <Icon name={icon} size={20} className={color.replace('bg-', 'text-')} />
            </div>
        </div>
        <div className="flex items-center gap-2">
            {change && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {change}
                </span>
            )}
            <span className="text-xs text-text-secondary">vs last period</span>
        </div>
    </div>
);

const FinanceAnalytics = () => {
    const { formatCurrency, convertAmount, getCurrencySymbol } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [kpiData, setKpiData] = useState({
        revenue: 0,
        expenses: 0,
        profit: 0,
        overdue: 0
    });
    const [chartData, setChartData] = useState([]);
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const invoicesSnap = await getDocs(collection(db, 'invoices'));
                const invoices = invoicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const expensesSnap = await getDocs(collection(db, 'expenses'));
                const expenses = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // --- Calculate KPIs ---
                const totalRevenue = invoices
                    .filter(inv => inv.status === 'Paid')
                    .reduce((sum, inv) => sum + convertAmount(Number(inv.total) || 0, inv.currency || 'USD'), 0);

                const totalExpenses = expenses
                    .reduce((sum, exp) => sum + convertAmount(Number(exp.amount) || 0, exp.currency || 'USD'), 0);

                const overdueAmount = invoices
                    .filter(inv => {
                        if (inv.status === 'Paid') return false;
                        const dueDate = new Date(inv.dueDate);
                        // overdue if active (sent/pending) and past due date
                        return (inv.status === 'Sent' || inv.status === 'Pending') && dueDate < new Date();
                    })
                    .reduce((sum, inv) => sum + convertAmount(Number(inv.total) || 0, inv.currency || 'USD'), 0);

                setKpiData({
                    revenue: totalRevenue,
                    expenses: totalExpenses,
                    profit: totalRevenue - totalExpenses,
                    overdue: overdueAmount
                });

                // --- Prepare Chart Data (Revenue vs Expenses by Month) ---
                const monthlyData = {};
                invoices.forEach(inv => {
                    if (inv.status === 'Paid' && inv.issueDate) {
                        const month = inv.issueDate.substring(0, 7);
                        if (!monthlyData[month]) monthlyData[month] = { name: month, revenue: 0, expenses: 0 };
                        monthlyData[month].revenue += convertAmount(Number(inv.total) || 0, inv.currency || 'USD');
                    }
                });
                expenses.forEach(exp => {
                    if (exp.date) {
                        const month = exp.date.substring(0, 7);
                        if (!monthlyData[month]) monthlyData[month] = { name: month, revenue: 0, expenses: 0 };
                        monthlyData[month].expenses += convertAmount(Number(exp.amount) || 0, exp.currency || 'USD');
                    }
                });
                const sortedChartData = Object.values(monthlyData).sort((a, b) => a.name.localeCompare(b.name));
                setChartData(sortedChartData);

                // --- Recent Transactions ---
                const recentInvoices = invoices.map(inv => ({
                    id: inv.id,
                    date: inv.issueDate,
                    type: 'Income',
                    description: `Invoice #${inv.invoiceNumber}`,
                    amount: Number(inv.total) || 0,
                    currency: inv.currency || 'USD',
                    project: 'N/A' // Could fetch project name if needed
                }));
                const recentExpenses = expenses.map(exp => ({
                    id: exp.id,
                    date: exp.date,
                    type: 'Expense',
                    description: exp.description || 'Expense',
                    amount: Number(exp.amount) || 0,
                    currency: exp.currency || 'USD',
                    project: 'N/A'
                }));

                const allTransactions = [...recentInvoices, ...recentExpenses]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 10);

                setTransactions(allTransactions);

            } catch (error) {
                console.error("Error fetching finance data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [convertAmount]);

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6 pb-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-h1 font-bold text-text-primary">Finance Analytics</h1>
                        <p className="text-text-secondary">Financial health, cashflow, and profitability.</p>
                    </div>
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard
                        title="Total Revenue"
                        value={formatCurrency(kpiData.revenue)}
                        trend="up"
                        icon="DollarSign"
                        color="bg-green-500"
                    />
                    <KPICard
                        title="Total Expenses"
                        value={formatCurrency(kpiData.expenses)}
                        trend="down"
                        icon="CreditCard"
                        color="bg-red-500"
                    />
                    <KPICard
                        title="Net Profit"
                        value={formatCurrency(kpiData.profit)}
                        trend={kpiData.profit >= 0 ? "up" : "down"}
                        icon="TrendingUp"
                        color="bg-blue-500"
                    />
                    <KPICard
                        title="Overdue Invoices"
                        value={formatCurrency(kpiData.overdue)}
                        trend="down"
                        icon="AlertCircle"
                        color="bg-orange-500"
                    />
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-surface p-6 rounded-lg border border-border">
                        <h3 className="text-lg font-bold text-text-primary mb-6">Revenue vs Expenses</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                    <XAxis dataKey="name" stroke="#888" />
                                    <YAxis stroke="#888" tickFormatter={(val) => getCurrencySymbol() + val} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee' }}
                                        formatter={(val) => formatCurrency(val)}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRevenue)" />
                                    <Area type="monotone" dataKey="expenses" stroke="#EF4444" fillOpacity={1} fill="url(#colorExpenses)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions Table */}
                <div className="bg-surface rounded-lg border border-border overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h3 className="text-lg font-bold text-text-primary">Recent Transactions</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-surface-secondary">
                            <tr>
                                <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase">Date</th>
                                <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase">Type</th>
                                <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase">Description</th>
                                <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx, index) => (
                                <tr key={index} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                                    <td className="py-4 px-6 text-text-secondary">{tx.date}</td>
                                    <td className="py-4 px-6">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${tx.type === 'Income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 font-medium text-text-primary">{tx.description}</td>
                                    <td className={`py-4 px-6 font-medium ${tx.type === 'Income' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {tx.type === 'Income' ? '+' : '-'}
                                        {formatCurrency(tx.amount, tx.currency)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default FinanceAnalytics;
