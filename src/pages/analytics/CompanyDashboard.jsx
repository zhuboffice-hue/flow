import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/ThreePaneLayout';
import Icon from '../../components/ui/Icon';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { exportToCSV } from '../../utils/export';
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

const CompanyDashboard = () => {
    const { currentUser } = useAuth();
    const { formatCurrency, convertAmount, getCurrencySymbol } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [kpiData, setKpiData] = useState({
        revenue: 0,
        expenses: 0,
        profit: 0,
        activeProjects: 0
    });
    const [chartData, setChartData] = useState([]);
    const [projectDistData, setProjectDistData] = useState([]);
    const [topProjects, setTopProjects] = useState([]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser?.companyId) return;
            try {
                setLoading(true);

                // Fetch Invoices (Revenue)
                const qInvoices = query(collection(db, 'invoices'), where('companyId', '==', currentUser.companyId));
                const invoicesSnap = await getDocs(qInvoices);
                const invoices = invoicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Fetch Expenses
                const qExpenses = query(collection(db, 'expenses'), where('companyId', '==', currentUser.companyId));
                const expensesSnap = await getDocs(qExpenses);
                const expenses = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Fetch Projects
                const qProjects = query(collection(db, 'projects'), where('companyId', '==', currentUser.companyId));
                const projectsSnap = await getDocs(qProjects);
                const projects = projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // --- Calculate KPIs ---
                const totalRevenue = invoices
                    .filter(inv => inv.status === 'Paid') // Assuming 'Paid' status
                    .reduce((sum, inv) => sum + convertAmount(Number(inv.total) || 0, inv.currency || 'USD'), 0);

                const totalExpenses = expenses
                    .reduce((sum, exp) => sum + convertAmount(Number(exp.amount) || 0, exp.currency || 'USD'), 0);

                const activeProjectsCount = projects.filter(p => p.status !== 'Completed').length;

                setKpiData({
                    revenue: totalRevenue,
                    expenses: totalExpenses,
                    profit: totalRevenue - totalExpenses,
                    activeProjects: activeProjectsCount
                });

                // --- Prepare Chart Data (Revenue vs Expenses by Month) ---
                // Group by Month (YYYY-MM)
                const monthlyData = {};

                invoices.forEach(inv => {
                    if (inv.status === 'Paid' && inv.issueDate) {
                        const month = inv.issueDate.substring(0, 7); // YYYY-MM
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

                // --- Prepare Project Distribution Data ---
                const statusCounts = {};
                projects.forEach(p => {
                    const status = p.status || 'Unknown';
                    statusCounts[status] = (statusCounts[status] || 0) + 1;
                });
                const distData = Object.keys(statusCounts).map(status => ({
                    name: status,
                    value: statusCounts[status]
                }));
                setProjectDistData(distData);

                // --- Top Projects (by Budget/Revenue - simplified here as just list) ---
                setTopProjects(projects.slice(0, 5)); // Just take first 5 for now

            } catch (error) {
                console.error("Error fetching analytics data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [convertAmount, currentUser]);

    const handleExport = () => {
        // Export Chart Data (Revenue/Expenses)
        exportToCSV(chartData, 'company_financials.csv');
    };

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
                        <h1 className="text-h1 font-bold text-text-primary">Company Dashboard</h1>
                        <p className="text-text-secondary">Overview of company performance metrics.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExport}
                            className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-dark flex items-center gap-2"
                        >
                            <Icon name="Download" size={16} />
                            Export Report
                        </button>
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
                        title="Active Projects"
                        value={kpiData.activeProjects}
                        trend="up"
                        icon="Folder"
                        color="bg-orange-500"
                    />
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-surface p-6 rounded-lg border border-border">
                        <h3 className="text-lg font-bold text-text-primary mb-6">Revenue vs Expenses</h3>
                        <div className="h-80 w-full" style={{ width: '99%', minWidth: 1 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                    <XAxis dataKey="name" stroke="#888" />
                                    <YAxis stroke="#888" tickFormatter={(val) => getCurrencySymbol() + val} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee' }}
                                        formatter={(val) => formatCurrency(val)}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
                                    <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-surface p-6 rounded-lg border border-border">
                        <h3 className="text-lg font-bold text-text-primary mb-6">Project Distribution</h3>
                        <div className="h-80 w-full" style={{ width: '99%', minWidth: 1 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={projectDistData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {projectDistData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Section */}
                <div className="bg-surface rounded-lg border border-border overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h3 className="text-lg font-bold text-text-primary">Recent Projects</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-surface-secondary">
                            <tr>
                                <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase">Project</th>
                                <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase">Client</th>
                                <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase">Budget</th>
                                <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProjects.map((project) => (
                                <tr key={project.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                                    <td className="py-4 px-6 font-medium text-text-primary">{project.name}</td>
                                    <td className="py-4 px-6 text-text-secondary">{project.clientName || 'N/A'}</td>
                                    <td className="py-4 px-6 text-text-primary">
                                        {formatCurrency(Number(project.budget || 0), project.currency)}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                            project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {project.status || 'Unknown'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {topProjects.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-4 text-center text-text-secondary">No projects found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default CompanyDashboard;
