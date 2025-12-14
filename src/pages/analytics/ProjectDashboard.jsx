import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/ThreePaneLayout';
import Icon from '../../components/ui/Icon';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
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
            <span className="text-xs text-text-secondary">vs budget</span>
        </div>
    </div>
);

const ProjectDashboard = () => {
    const { currentUser } = useAuth();
    const { formatCurrency, convertAmount } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [kpiData, setKpiData] = useState({
        budgetUsed: 0,
        tasksCompleted: 0,
        pendingMilestones: 0,
        risksDetected: 0
    });
    const [budgetData, setBudgetData] = useState([]);
    const [taskStatusData, setTaskStatusData] = useState([]);
    const [risks, setRisks] = useState([]);

    const COLORS = ['#9CA3AF', '#3B82F6', '#F59E0B', '#10B981'];

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser?.companyId) return;
            try {
                setLoading(true);

                // Fetch Projects
                const qProjects = query(collection(db, 'projects'), where('companyId', '==', currentUser.companyId));
                const projectsSnap = await getDocs(qProjects);
                const projects = projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Fetch Tasks
                const qTasks = query(collection(db, 'tasks'), where('companyId', '==', currentUser.companyId));
                const tasksSnap = await getDocs(qTasks);
                const tasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Fetch Expenses
                const qExpenses = query(collection(db, 'expenses'), where('companyId', '==', currentUser.companyId));
                const expensesSnap = await getDocs(qExpenses);
                const expenses = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // --- Calculate KPIs ---
                const totalBudget = projects.reduce((sum, p) => sum + convertAmount(Number(p.budget) || 0, p.currency || 'USD'), 0);

                // Calculate total spent based on expenses linked to projects
                const totalSpent = expenses
                    .filter(exp => exp.projectId)
                    .reduce((sum, exp) => sum + convertAmount(Number(exp.amount) || 0, exp.currency || 'USD'), 0);

                const totalTasks = tasks.length;
                const completedTasks = tasks.filter(t => t.completed).length;

                setKpiData({
                    budgetUsed: formatCurrency(totalSpent),
                    tasksCompleted: `${completedTasks}/${totalTasks}`,
                    pendingMilestones: 0, // Placeholder as we don't have milestones collection yet
                    risksDetected: 0 // Placeholder
                });

                // --- Budget Usage Over Time (Mocking time series from project data if available, else static for now to avoid empty chart) ---
                // Ideally we'd have a 'budgetHistory' collection. For now, let's just show current totals if no history.
                setBudgetData([
                    { name: 'Total', budget: totalBudget, actual: totalSpent }
                ]);

                // --- Task Distribution ---
                const statusCounts = {};
                tasks.forEach(t => {
                    const status = t.status || (t.completed ? 'Done' : 'To Do');
                    statusCounts[status] = (statusCounts[status] || 0) + 1;
                });
                const tData = Object.keys(statusCounts).map(status => ({
                    name: status,
                    value: statusCounts[status]
                }));
                setTaskStatusData(tData);

                // --- Risks (Mocking from project status or notes) ---
                // If we had a risks collection, we'd fetch it. For now, empty or derived.
                setRisks([]);

            } catch (error) {
                console.error("Error fetching project data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [convertAmount, currentUser]);

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
                        <h1 className="text-h1 font-bold text-text-primary">Project Analytics</h1>
                        <p className="text-text-secondary">Track project health, budget, and milestones.</p>
                    </div>
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard title="Budget Used" value={kpiData.budgetUsed} trend="down" icon="DollarSign" color="bg-blue-500" />
                    <KPICard title="Tasks Completed" value={kpiData.tasksCompleted} trend="up" icon="CheckSquare" color="bg-green-500" />
                    <KPICard title="Pending Milestones" value={kpiData.pendingMilestones} trend="down" icon="Flag" color="bg-orange-500" />
                    <KPICard title="Risks Detected" value={kpiData.risksDetected} trend="down" icon="AlertTriangle" color="bg-red-500" />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-surface p-6 rounded-lg border border-border">
                        <h3 className="text-lg font-bold text-text-primary mb-6">Budget Overview</h3>
                        <div className="h-80 w-full" style={{ width: '99%', minWidth: 1 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={budgetData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                    <XAxis dataKey="name" stroke="#888" />
                                    <YAxis stroke="#888" />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee' }} />
                                    <Legend />
                                    <Bar dataKey="budget" name="Planned Budget" fill="#9CA3AF" />
                                    <Bar dataKey="actual" name="Actual Spend" fill="#3B82F6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-surface p-6 rounded-lg border border-border">
                        <h3 className="text-lg font-bold text-text-primary mb-6">Task Distribution</h3>
                        <div className="h-80 w-full" style={{ width: '99%', minWidth: 1 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={taskStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {taskStatusData.map((entry, index) => (
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

                {/* Risk Analysis Table */}
                <div className="bg-surface rounded-lg border border-border overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h3 className="text-lg font-bold text-text-primary">Risk Analysis</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-surface-secondary">
                            <tr>
                                <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase">Risk</th>
                                <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase">Severity</th>
                                <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase">Owner</th>
                                <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {risks.map((risk, index) => (
                                <tr key={index} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                                    <td className="py-4 px-6 font-medium text-text-primary">{risk.name}</td>
                                    <td className="py-4 px-6">
                                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">{risk.severity}</span>
                                    </td>
                                    <td className="py-4 px-6 text-text-secondary">{risk.owner}</td>
                                    <td className="py-4 px-6 text-text-secondary">{risk.status}</td>
                                </tr>
                            ))}
                            {risks.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-4 text-center text-text-secondary">No risks detected.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default ProjectDashboard;
