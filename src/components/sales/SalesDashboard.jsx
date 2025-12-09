import React, { useMemo } from 'react';
import Icon from '../ui/Icon';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useCurrency } from '../../hooks/useCurrency';

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

const SalesDashboard = ({ leads = [] }) => {
    const { formatCurrency, convertAmount, getCurrencySymbol } = useCurrency();
    const currencySymbol = getCurrencySymbol();

    // Calculate KPIs
    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter(l => l.stage === 'qualified').length;
    const dealsWon = leads.filter(l => l.stage === 'won').length;
    const dealsLost = leads.filter(l => l.stage === 'lost').length;

    // Calculate Pipeline Value (sum of values of active leads)
    const pipelineValue = leads
        .filter(l => !['won', 'lost'].includes(l.stage))
        .reduce((sum, lead) => {
            const val = parseFloat((lead.value || '0').replace(/[^0-9.-]+/g, ""));
            const rawAmount = isNaN(val) ? 0 : val;
            // Assume raw amount is USD if no currency specified on lead
            // In a deeper implementation, leads would have a currency field.
            return sum + convertAmount(rawAmount, lead.currency || 'USD');
        }, 0);

    // --- Chart Data Processing ---

    // 1. Revenue / Won Deals Over Time
    const revenueData = useMemo(() => {
        const wonLeads = leads.filter(l => l.stage === 'won');
        // Group by Month (YYYY-MM)
        const grouped = wonLeads.reduce((acc, lead) => {
            const date = lead.createdAt?.seconds ? new Date(lead.createdAt.seconds * 1000) : new Date();
            const month = date.toLocaleString('default', { month: 'short' }); // e.g., 'Jan'

            const val = parseFloat((lead.value || '0').replace(/[^0-9.-]+/g, ""));
            const rawRevenue = isNaN(val) ? 0 : val;
            const revenue = convertAmount(rawRevenue, lead.currency || 'USD');

            const existing = acc.find(item => item.name === month);
            if (existing) {
                existing.revenue += revenue;
            } else {
                acc.push({ name: month, revenue: revenue, sortDate: date });
            }
            return acc;
        }, []);

        // Sort by date and take last 6 months usually, or just return allsorted
        return grouped.sort((a, b) => a.sortDate - b.sortDate);
    }, [leads, convertAmount]);

    // 2. Sales Funnel (Leads by Stage)
    const funnelData = useMemo(() => {
        const stages = ['New Lead', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']; // Standard stages

        // Normalize stage names from leads to match standard chart keys if needed
        // Assuming lead.stage values are lowercase or mixed, let's normalize

        const counts = leads.reduce((acc, lead) => {
            // Simple normalization to Title Case or lowercase check
            // If lead.stage is 'new', map to 'New Lead' etc.
            // For now, let's just count unique stages found in data + standard ones
            let stageName = lead.stage || 'Unknown';
            // Capitalize first letter
            stageName = stageName.charAt(0).toUpperCase() + stageName.slice(1);
            if (stageName === 'New') stageName = 'New Lead';

            acc[stageName] = (acc[stageName] || 0) + 1;
            return acc;
        }, {});

        // Map standard stages to data array to ensure order
        // OR just map the counts found. Let's try to map standard stages for a proper funnel look
        const standardStages = [
            { id: 'start', name: 'New Lead' }, // 'new'
            { id: 'qualify', name: 'Qualified' },
            { id: 'active', name: 'Proposal' }, // approximate
            { id: 'won', name: 'Won' },
            { id: 'lost', name: 'Lost' }
        ];

        // Create data array properties
        return Object.keys(counts).map(key => ({
            name: key,
            count: counts[key]
        })).sort((a, b) => b.count - a.count); // Sort by count desc for funnel shape? Or by stage logic?
        // Let's rely on data present for now
    }, [leads]);


    return (
        <div className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <KPICard label="Total Leads" value={totalLeads} trend="up" trendValue="+12%" icon="Users" color="primary" />
                <KPICard label="Qualified" value={qualifiedLeads} trend="up" trendValue="+5%" icon="CheckCircle" color="success" />
                <KPICard label="Deals Won" value={dealsWon} trend="up" trendValue="+2" icon="Award" color="success" />
                <KPICard label="Deals Lost" value={dealsLost} trend="down" trendValue="-1" icon="XCircle" color="danger" />
                <KPICard label="Pipeline Value" value={formatCurrency(pipelineValue)} trend="up" trendValue="+$50k" icon="DollarSign" color="primary" />
                <KPICard label="Forecast" value={formatCurrency(120000)} trend="up" trendValue="This Month" icon="BarChart2" color="primary" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-surface p-6 rounded-lg border border-border">
                    <h3 className="font-bold text-lg text-text-primary mb-6">Revenue Trend (Won Deals)</h3>
                    <div className="h-64 w-full text-xs">
                        {revenueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                    <XAxis dataKey="name" stroke="#9ca3af" tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9ca3af" tickLine={false} axisLine={false} tickFormatter={(value) => `${currencySymbol}${value}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                        formatter={(value) => [`${currencySymbol}${value}`, 'Revenue']}
                                    />
                                    <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-text-secondary bg-surface-secondary/30 rounded border border-dashed border-border">
                                No sales data yet
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-surface p-6 rounded-lg border border-border">
                    <h3 className="font-bold text-lg text-text-primary mb-6">Lead Distribution</h3>
                    <div className="h-64 w-full text-xs">
                        {funnelData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={funnelData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                    <XAxis type="number" stroke="#9ca3af" tickLine={false} axisLine={false} />
                                    <YAxis dataKey="name" type="category" width={80} stroke="#9ca3af" tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px' }} />
                                    <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]}>
                                        {funnelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563eb' : '#60a5fa'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-text-secondary bg-surface-secondary/30 rounded border border-dashed border-border">
                                No lead data
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Leads */}
                <div className="bg-surface rounded-lg border border-border overflow-hidden">
                    <div className="p-6 border-b border-border flex justify-between items-center">
                        <h3 className="font-bold text-lg text-text-primary">Recent Leads</h3>
                        <button className="text-sm text-primary hover:underline">View All</button>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-surface-secondary text-text-secondary font-medium">
                            <tr>
                                <th className="px-6 py-3">Lead Name</th>
                                <th className="px-6 py-3">Source</th>
                                <th className="px-6 py-3">Stage</th>
                                <th className="px-6 py-3 text-right">Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {leads.slice(0, 5).map((lead) => (
                                <tr key={lead.id} className="hover:bg-background">
                                    <td className="px-6 py-4 font-medium text-text-primary">{lead.name} <span className="text-text-secondary text-xs block">{lead.company}</span></td>
                                    <td className="px-6 py-4 text-text-secondary">{lead.source}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs border border-primary/20 capitalize">{lead.stage}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-text-primary">{lead.value}</td>
                                </tr>
                            ))}
                            {leads.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-text-secondary">No leads found. Create one to get started.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Upcoming Follow-ups */}
                <div className="bg-surface rounded-lg border border-border overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h3 className="font-bold text-lg text-text-primary">Upcoming Follow-ups</h3>
                    </div>
                    <div className="divide-y divide-border">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-4 flex items-center justify-between hover:bg-background transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center text-text-secondary">
                                        <Icon name="Phone" size={18} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-text-primary">Call with Acme Corp</p>
                                        <p className="text-xs text-text-secondary">Due Today • High Priority</p>
                                    </div>
                                </div>
                                <button className="p-2 text-text-secondary hover:text-primary transition-colors">
                                    <Icon name="CheckCircle" size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesDashboard;
