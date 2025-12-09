import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/ThreePaneLayout';
import Icon from '../../components/ui/Icon';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
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

const SalesAnalytics = () => {
    const { formatCurrency, convertAmount } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [kpiData, setKpiData] = useState({
        totalLeads: 0,
        winRate: 0,
        pipelineValue: 0,
        dealsWon: 0,
        dealsLost: 0
    });
    const [pipelineData, setPipelineData] = useState([]);
    const [sourceData, setSourceData] = useState([]);
    const [topLeads, setTopLeads] = useState([]);

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#EF4444'];

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const leadsSnap = await getDocs(collection(db, 'leads'));
                const leads = leadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // --- Calculate KPIs ---
                const totalLeads = leads.length;
                const wonLeads = leads.filter(l => l.status === 'Won').length;
                const lostLeads = leads.filter(l => l.status === 'Lost').length;
                const winRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;

                const pipelineValue = leads
                    .filter(l => l.status !== 'Lost' && l.status !== 'Won')
                    .reduce((sum, l) => {
                        // Ensure value is treated as number and convert
                        const val = Number(l.value) || 0;
                        return sum + convertAmount(val, l.currency || 'USD');
                    }, 0);

                setKpiData({
                    totalLeads,
                    winRate: `${winRate}%`,
                    pipelineValue: pipelineValue,
                    dealsWon: wonLeads,
                    dealsLost: lostLeads
                });

                // --- Pipeline Data ---
                const statusCounts = {};
                leads.forEach(l => {
                    const status = l.status || 'New';
                    statusCounts[status] = (statusCounts[status] || 0) + 1;
                });
                // Define standard order
                const stages = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won'];
                const pData = stages.map(stage => ({
                    name: stage,
                    value: statusCounts[stage] || 0
                }));
                // Add any other statuses found
                Object.keys(statusCounts).forEach(status => {
                    if (!stages.includes(status) && status !== 'Lost') {
                        pData.push({ name: status, value: statusCounts[status] });
                    }
                });
                setPipelineData(pData);

                // --- Source Data ---
                const sourceCounts = {};
                leads.forEach(l => {
                    const source = l.source || 'Unknown';
                    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
                });
                const sData = Object.keys(sourceCounts).map(source => ({
                    name: source,
                    value: sourceCounts[source]
                }));
                setSourceData(sData);

                // --- Top Leads ---
                // Sort by value descending (converted value)
                const sortedLeads = [...leads].sort((a, b) => {
                    const valA = convertAmount(Number(a.value) || 0, a.currency || 'USD');
                    const valB = convertAmount(Number(b.value) || 0, b.currency || 'USD');
                    return valB - valA;
                });
                setTopLeads(sortedLeads.slice(0, 5));

            } catch (error) {
                console.error("Error fetching sales data:", error);
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
                        <h1 className="text-h1 font-bold text-text-primary">Sales Analytics</h1>
                        <p className="text-text-secondary">Monitor sales pipeline and revenue forecasts.</p>
                    </div>
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <KPICard title="Total Leads" value={kpiData.totalLeads} trend="up" icon="Users" color="bg-blue-500" />
                    <KPICard title="Win Rate" value={kpiData.winRate} trend="up" icon="Target" color="bg-green-500" />
                    <KPICard title="Pipeline Value" value={formatCurrency(kpiData.pipelineValue)} trend="up" icon="DollarSign" color="bg-purple-500" />
                    <KPICard title="Deals Won" value={kpiData.dealsWon} trend="up" icon="Award" color="bg-orange-500" />
                    <KPICard title="Deals Lost" value={kpiData.dealsLost} trend="down" icon="XCircle" color="bg-red-500" />
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-surface p-6 rounded-lg border border-border">
                        <h3 className="text-lg font-bold text-text-primary mb-6">Pipeline Performance</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={pipelineData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
                                    <XAxis type="number" stroke="#888" />
                                    <YAxis dataKey="name" type="category" width={100} stroke="#888" />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee' }} />
                                    <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-surface p-6 rounded-lg border border-border">
                        <h3 className="text-lg font-bold text-text-primary mb-6">Lead Sources</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sourceData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {sourceData.map((entry, index) => (
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

                {/* Top Leads Table */}
                <div className="bg-surface rounded-lg border border-border overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h3 className="text-lg font-bold text-text-primary">Top Leads</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-surface-secondary">
                            <tr>
                                <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase">Lead</th>
                                <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase">Value</th>
                                <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase">Stage</th>
                                <th className="text-left py-3 px-6 text-xs font-medium text-text-secondary uppercase">Assignee</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topLeads.map((lead) => (
                                <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                                    <td className="py-4 px-6 font-medium text-text-primary">{lead.company}</td>
                                    <td className="py-4 px-6 text-text-primary">{formatCurrency(lead.value || 0, lead.currency)}</td>
                                    <td className="py-4 px-6">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-text-secondary">{lead.assignee || 'Unassigned'}</td>
                                </tr>
                            ))}
                            {topLeads.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-4 text-center text-text-secondary">No leads found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default SalesAnalytics;
