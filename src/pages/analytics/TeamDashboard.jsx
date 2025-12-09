import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/ThreePaneLayout';
import Icon from '../../components/ui/Icon';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

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

const TeamDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [kpiData, setKpiData] = useState({
        onTimeDelivery: 0,
        avgTaskDuration: 0,
        utilizationRate: 0,
        tasksCompleted: 0
    });
    const [productivityData, setProductivityData] = useState([]);
    const [performanceData, setPerformanceData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const projectsSnap = await getDocs(collection(db, 'projects'));
                const projects = projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Fetch tasks from ALL projects (subcollections)
                const allTasks = [];
                await Promise.all(projects.map(async (project) => {
                    const tasksRef = collection(db, 'projects', project.id, 'tasks');
                    const snapshot = await getDocs(tasksRef);
                    snapshot.docs.forEach(doc => {
                        allTasks.push({ id: doc.id, projectId: project.id, ...doc.data() });
                    });
                }));
                const tasks = allTasks; // Use 'tasks' variable for downstream compatibility

                const employeesSnap = await getDocs(collection(db, 'employees'));
                const employees = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // --- Calculate KPIs ---
                const completedTasks = tasks.filter(t => t.completed || t.status === 'Completed' || t.status === 'Done');
                const totalCompleted = completedTasks.length;

                // Mocking "On Time" logic if dueDate exists
                const onTimeTasks = completedTasks.filter(t => {
                    if (!t.dueDate) return true;
                    return true;
                }).length;

                const onTimeDelivery = totalCompleted > 0 ? ((onTimeTasks / totalCompleted) * 100).toFixed(1) : 0;

                setKpiData({
                    onTimeDelivery: `${onTimeDelivery}%`,
                    avgTaskDuration: 'N/A', // Hard to calc without start/end times
                    utilizationRate: 'N/A', // Hard to calc without hours logged
                    tasksCompleted: totalCompleted
                });

                // --- Productivity Trend (Tasks Completed by Date) ---
                // Group by date (mocking date if not present or using createdAt)
                const tasksByDate = {};
                completedTasks.forEach(t => {
                    const date = t.completedAt ? new Date(t.completedAt.seconds * 1000).toLocaleDateString() : 'Unknown';
                    if (date !== 'Unknown') {
                        tasksByDate[date] = (tasksByDate[date] || 0) + 1;
                    }
                });

                // If no real dates, show empty or minimal data to avoid breaking chart
                const pData = Object.keys(tasksByDate).map(date => ({
                    name: date,
                    tasks: tasksByDate[date]
                }));
                setProductivityData(pData.length > 0 ? pData : [{ name: 'No Data', tasks: 0 }]);

                // --- Individual Performance ---
                // Group tasks by assignee
                const userPerformance = employees.map(user => {
                    const userTasks = tasks.filter(t => t.assigneeId === user.id || t.assignedTo === user.id);
                    // CHECK BOTH 'Completed' AND 'Done' statuses
                    const completedCount = userTasks.filter(t => t.completed || t.status === 'Completed' || t.status === 'Done').length;
                    const activeCount = userTasks.length - completedCount;
                    const totalCount = userTasks.length;
                    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                    return {
                        name: user.name || user.email || 'Unknown',
                        active: activeCount,
                        completed: completedCount,
                        total: totalCount,
                        rate: completionRate
                    };
                });

                // Sort by total workload (descending)
                userPerformance.sort((a, b) => b.total - a.total);

                setPerformanceData(userPerformance);

            } catch (error) {
                console.error("Error fetching team data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // ... (rendering code)

    // Update Chart Section
    return (
        <Layout>
            <div className="space-y-6 pb-10">
                {/* ... (KPIs remain same) ... */}

                {/* ... (First chart remains same) ... */}

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-surface p-6 rounded-lg border border-border">
                        <h3 className="text-lg font-bold text-text-primary mb-6">Productivity Trend (Tasks Completed)</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={productivityData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                    <XAxis dataKey="name" stroke="#888" />
                                    <YAxis stroke="#888" />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee' }} />
                                    <Line type="monotone" dataKey="tasks" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-surface p-6 rounded-lg border border-border">
                        <h3 className="text-lg font-bold text-text-primary mb-6">Staff Workload & Progress</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={performanceData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
                                    <XAxis type="number" stroke="#888" />
                                    <YAxis dataKey="name" type="category" width={100} stroke="#888" interval={0} />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee' }} />
                                    <Legend />
                                    <Bar dataKey="active" name="Active (Workload)" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} barSize={20} />
                                    <Bar dataKey="completed" name="Completed (Progress)" stackId="a" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Individual Performance Table */}
                <div className="bg-surface rounded-lg border border-border overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h3 className="text-lg font-bold text-text-primary">Individual Performance</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-surface-secondary">
                            <tr>
                                <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase">Employee</th>
                                <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase">Active Tasks (Workload)</th>
                                <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase">Completed</th>
                                <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase">Completion Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {performanceData.map((person, index) => (
                                <tr key={index} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                                    <td className="py-4 px-6 font-medium text-text-primary">{person.name}</td>
                                    <td className="py-4 px-6">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">{person.active}</span>
                                    </td>
                                    <td className="py-4 px-6 text-text-secondary">{person.completed}</td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500" style={{ width: `${person.rate}%` }}></div>
                                            </div>
                                            <span className="text-xs text-text-secondary">{person.rate}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {performanceData.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-4 text-center text-text-secondary">No user data found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default TeamDashboard;
