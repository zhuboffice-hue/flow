import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ThreePaneLayout from '../components/layout/ThreePaneLayout';
import Icon from '../components/ui/Icon';
import Badge from '../components/ui/Badge';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../hooks/useCurrency';

const KPICard = ({ title, value, change, trend, icon, color }) => (
    <div className="bg-surface p-6 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${color}`}>
                <Icon name={icon} size={20} className="text-white" />
            </div>
            {change && (
                <Badge variant={trend === 'up' ? 'success' : 'danger'} className="flex items-center gap-1">
                    <Icon name={trend === 'up' ? 'ArrowUp' : 'ArrowDown'} size={12} />
                    {change}
                </Badge>
            )}
        </div>
        <h3 className="text-small font-medium text-text-secondary mb-1">{title}</h3>
        <span className="text-h2 font-bold text-text-primary">{value}</span>
    </div>
);

const Dashboard = () => {
    const { currentUser } = useAuth();
    const { formatCurrency, convertAmount, getCurrencySymbol } = useCurrency();
    const currencySymbol = getCurrencySymbol();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        revenue: 0,
        activeProjects: 0,
        pendingInvoices: 0,
        completedTasks: 0
    });
    const [tasks, setTasks] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;

            try {
                // 1. Fetch Invoices (Revenue & Pending)
                const invoicesRef = collection(db, 'invoices');
                // Filter by companyId
                const invoicesQuery = query(invoicesRef, where('companyId', '==', currentUser.companyId));
                const invoicesSnapshot = await getDocs(invoicesQuery);

                let totalRevenue = 0;
                let pendingCount = 0;
                const monthlyRevenue = {};

                invoicesSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.status === 'Paid') {
                        // Convert amount to company currency before adding
                        const convertedAmount = convertAmount(Number(data.total || 0), data.currency || 'USD');
                        totalRevenue += convertedAmount;

                        // Chart Data Preparation (Group by Month)
                        const date = data.issueDate ? new Date(data.issueDate) : new Date();
                        const month = date.toLocaleString('default', { month: 'short' });
                        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + convertedAmount;
                    } else if (data.status === 'Pending' || data.status === 'Sent') {
                        pendingCount++;
                    }
                });

                const chartDataFormatted = Object.keys(monthlyRevenue).map(key => ({
                    name: key,
                    revenue: monthlyRevenue[key]
                }));

                // 2. Fetch Projects (Active)
                const projectsRef = collection(db, 'projects');
                // Filter by companyId
                const projectsQuery = query(projectsRef, where('companyId', '==', currentUser.companyId));
                const projectsSnapshot = await getDocs(projectsQuery);
                const projects = projectsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

                // Count active projects
                const activeProjectsCount = projects.filter(p => p.status === 'In Progress' || p.status === 'Active').length;

                // 3. Fetch Tasks (My Tasks & Completed KPI)
                // Need to resolve Auth UID -> Employee ID via Email match
                const employeesRef = collection(db, 'employees');
                // Filter by companyId
                const employeesQuery = query(employeesRef, where('companyId', '==', currentUser.companyId));
                const employeesSnap = await getDocs(employeesQuery);
                const currentEmployee = employeesSnap.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .find(emp => emp.email && emp.email.toLowerCase() === currentUser.email.toLowerCase());

                const currentEmployeeId = currentEmployee?.id;

                // Since tasks are in subcollections, we iterate projects
                let myTasksList = [];
                let completedCount = 0;

                await Promise.all(projects.map(async (project) => {
                    const tasksRef = collection(db, 'projects', project.id, 'tasks');
                    // Simple query to minimize read cost if possible, otherwise client filter
                    const snapshot = await getDocs(tasksRef);

                    snapshot.docs.forEach(doc => {
                        const t = doc.data();

                        // Robust assignment check:
                        // 1. Auth UID (direct assignment)
                        // 2. Employee ID (from dropdown selection)
                        // 3. Email (fallback)
                        const isAssigned =
                            (t.assigneeId === currentUser.uid) ||
                            (t.assignedTo === currentUser.uid) ||
                            (currentEmployeeId && t.assigneeId === currentEmployeeId) ||
                            (t.assigneeEmail && currentUser.email && t.assigneeEmail.toLowerCase() === currentUser.email.toLowerCase());

                        if (isAssigned) {
                            if (t.status === 'Done' || t.status === 'Completed') {
                                completedCount++;
                            } else {
                                // Add to list for "My Tasks" (include Done? usually dashboard shows pending)
                                // Let's include all non-done for the list, or just all?
                                // "My Tasks" usually implies pending work.
                                if (t.status !== 'Done' && t.status !== 'Completed') {
                                    myTasksList.push({
                                        id: doc.id,
                                        projectId: project.id,
                                        projectName: project.name,
                                        ...t
                                    });
                                }
                            }
                        }
                    });
                }));

                // Sort myTasks by due date
                myTasksList.sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });

                setStats({
                    revenue: totalRevenue,
                    activeProjects: activeProjectsCount,
                    pendingInvoices: pendingCount,
                    completedTasks: completedCount
                });
                setTasks(myTasksList.slice(0, 5));
                setChartData(chartDataFormatted.length > 0 ? chartDataFormatted : [{ name: 'No Data', revenue: 0 }]);

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser, convertAmount]);

    if (loading) {
        return (
            <ThreePaneLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </ThreePaneLayout>
        );
    }

    return (
        <ThreePaneLayout>
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-h1 font-bold text-text-primary">Dashboard</h1>
                    <p className="text-text-secondary mt-1">Welcome back, {currentUser?.displayName || 'User'}. Here's what's happening today.</p>
                </div>
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                    <button onClick={() => navigate('/app/projects')} className="bg-surface border border-border text-text-primary px-4 py-3 md:py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors flex-1 md:flex-none justify-center">
                        View Projects
                    </button>
                    <button onClick={() => navigate('/app/finance/invoices/new')} className="bg-primary text-white px-4 py-3 md:py-2 rounded-md text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm flex-1 md:flex-none justify-center">
                        + New Invoice
                    </button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                <KPICard
                    title="Total Revenue"
                    value={formatCurrency(stats.revenue)}
                    icon="DollarSign"
                    color="bg-green-500"
                    trend="up"
                    change="All time"
                />
                <KPICard
                    title="Active Projects"
                    value={stats.activeProjects}
                    icon="Briefcase"
                    color="bg-blue-500"
                />
                <KPICard
                    title="Pending Invoices"
                    value={stats.pendingInvoices}
                    icon="FileText"
                    color="bg-orange-500"
                />
                <KPICard
                    title="Tasks Completed"
                    value={stats.completedTasks}
                    icon="CheckSquare"
                    color="bg-purple-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-surface rounded-lg border border-border p-4 md:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-h3 font-semibold text-text-primary">Revenue Overview</h3>
                        <select className="bg-background border border-border rounded-md text-sm px-2 py-1 outline-none focus:border-primary">
                            <option>This Year</option>
                            <option>Last Year</option>
                        </select>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(value) => `${currencySymbol}${value}`} />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ color: '#111827', fontWeight: 600 }}
                                    formatter={(value) => [`${currencySymbol}${value}`, 'Revenue']}
                                />
                                <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* My Tasks */}
                <div className="bg-surface rounded-lg border border-border p-6 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-h3 font-semibold text-text-primary">My Tasks</h3>
                        <button onClick={() => navigate('/app/tasks')} className="text-primary text-sm font-medium hover:underline">View All</button>
                    </div>

                    <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {tasks.length === 0 ? (
                            <div className="text-center py-8 text-text-secondary">
                                <p>No tasks assigned to you.</p>
                            </div>
                        ) : (
                            tasks.map(task => {
                                const progress = task.progress !== undefined ? task.progress :
                                    (task.status === 'Done' || task.status === 'Completed' ? 100 :
                                        task.status === 'Review' ? 75 :
                                            task.status === 'In Progress' ? 50 : 0);

                                return (
                                    <div key={task.id} className="group flex flex-col gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-border" onClick={() => navigate('/app/tasks')}>
                                        <div className="flex items-start gap-3 w-full">
                                            <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${task.status === 'Completed' || task.status === 'Done' ? 'bg-green-100 border-green-500' : 'border-gray-300'}`}>
                                                {(task.status === 'Completed' || task.status === 'Done') && <Icon name="Check" size={12} className="text-green-600" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-text-primary truncate group-hover:text-primary transition-colors">{task.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant={task.priority === 'High' || task.priority === 'Critical' ? 'danger' : 'default'} size="sm">{task.priority}</Badge>
                                                    <span className="text-xs text-text-secondary">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="w-full pl-8 pr-2">
                                            <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                                                <span>Progress</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-primary'}`}
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    <button onClick={() => navigate('/app/tasks')} className="w-full mt-4 py-2 border border-dashed border-border rounded-md text-text-secondary text-sm hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
                        <Icon name="Plus" size={16} />
                        Add New Task
                    </button>
                </div>
            </div>
        </ThreePaneLayout>
    );
};

export default Dashboard;
