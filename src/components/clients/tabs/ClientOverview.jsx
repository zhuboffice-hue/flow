import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Icon from '../../ui/Icon';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';

const SummaryCard = ({ label, value, icon, trend }) => (
    <div className="bg-surface p-4 rounded-lg border border-border">
        <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-small">{label}</span>
            <Icon name={icon} size={16} className="text-muted" />
        </div>
        <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-text-primary">{value}</span>
            {trend && (
                <span className={`text-xs font-medium ${trend > 0 ? 'text-success' : 'text-danger'}`}>
                    {trend > 0 ? '+' : ''}{trend}%
                </span>
            )}
        </div>
    </div>
);

const ClientOverview = ({ client }) => {
    const [stats, setStats] = useState({
        totalProjects: 0,
        activeProjects: 0,
        outstanding: 0,
        pendingApprovals: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        if (!client?.id) return;

        // Fetch Projects Stats
        const projectsUnsub = onSnapshot(query(collection(db, 'projects'), where('clientId', '==', client.id)), (snapshot) => {
            const projects = snapshot.docs.map(doc => doc.data());
            setStats(prev => ({
                ...prev,
                totalProjects: projects.length,
                activeProjects: projects.filter(p => p.status === 'In Progress').length
            }));
        });

        // Fetch Invoices Stats
        const invoicesUnsub = onSnapshot(query(collection(db, 'invoices'), where('clientId', '==', client.id)), (snapshot) => {
            const invoices = snapshot.docs.map(doc => doc.data());
            const outstanding = invoices
                .filter(inv => inv.status === 'Unpaid' || inv.status === 'Overdue')
                .reduce((acc, curr) => acc + (parseFloat(curr.amount.replace(/[^0-9.-]+/g, "")) || 0), 0);
            setStats(prev => ({
                ...prev,
                outstanding: outstanding
            }));
        });

        // Fetch Approvals Stats
        const approvalsUnsub = onSnapshot(query(collection(db, 'clients', client.id, 'approvals'), where('status', '==', 'Pending')), (snapshot) => {
            setStats(prev => ({
                ...prev,
                pendingApprovals: snapshot.size
            }));
        });

        // Fetch Recent Activity (Communication Logs)
        const activityUnsub = onSnapshot(collection(db, 'clients', client.id, 'communication'), (snapshot) => {
            const logs = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 5);
            setRecentActivity(logs);
        });

        return () => {
            projectsUnsub();
            invoicesUnsub();
            approvalsUnsub();
            activityUnsub();
        };
    }, [client?.id]);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="Total Projects" value={stats.totalProjects} icon="Folder" />
                <SummaryCard label="Active Projects" value={stats.activeProjects} icon="Activity" />
                <SummaryCard label="Outstanding" value={`$${stats.outstanding.toLocaleString()}`} icon="DollarSign" />
                <SummaryCard label="Pending Approvals" value={stats.pendingApprovals} icon="CheckSquare" />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Client Info */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-surface p-6 rounded-lg border border-border">
                        <h3 className="font-bold text-text-primary mb-4">Client Information</h3>
                        <div className="grid grid-cols-2 gap-y-4 text-small">
                            <div>
                                <span className="text-text-secondary block mb-1">Industry</span>
                                <span className="text-text-primary font-medium">{client.industry || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-text-secondary block mb-1">Website</span>
                                {client.website ? (
                                    <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                        {client.website}
                                    </a>
                                ) : (
                                    <span className="text-text-primary">N/A</span>
                                )}
                            </div>
                            <div>
                                <span className="text-text-secondary block mb-1">Account Manager</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
                                        {(client.accountManager || '?').charAt(0)}
                                    </div>
                                    <span className="text-text-primary font-medium">{client.accountManager || 'Unassigned'}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-text-secondary block mb-1">Status</span>
                                <Badge variant="success">Active</Badge>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-border">
                            <span className="text-text-secondary block mb-2">Tags</span>
                            <div className="flex gap-2 flex-wrap">
                                {client.tags ? client.tags.split(',').map((tag, i) => (
                                    <Badge key={i} variant="outline">{tag.trim()}</Badge>
                                )) : <span className="text-text-secondary text-xs">No tags</span>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface p-6 rounded-lg border border-border">
                        <h3 className="font-bold text-text-primary mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                            {recentActivity.length === 0 ? (
                                <p className="text-text-secondary text-small">No recent activity.</p>
                            ) : (
                                recentActivity.map((log) => (
                                    <div key={log.id} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                            <Icon name="MessageSquare" size={14} className="text-text-secondary" />
                                        </div>
                                        <div>
                                            <p className="text-small text-text-primary">
                                                <span className="font-medium">{log.user}</span>: {log.summary}
                                            </p>
                                            <p className="text-xs text-text-secondary">{new Date(log.createdAt?.seconds * 1000).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Primary Contact */}
                <div className="space-y-6">
                    <div className="bg-surface p-6 rounded-lg border border-border">
                        <h3 className="font-bold text-text-primary mb-4">Primary Contact</h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold">
                                {(client.primaryName || '?').charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-text-primary">{client.primaryName || 'No Contact'}</p>
                                <p className="text-xs text-text-secondary">Primary Contact</p>
                            </div>
                        </div>
                        <div className="space-y-3 text-small">
                            <div className="flex items-center gap-2 text-text-secondary">
                                <Icon name="Mail" size={14} />
                                <a href={`mailto:${client.primaryEmail}`} className="hover:text-primary transition-colors">{client.primaryEmail || 'No Email'}</a>
                            </div>
                            <div className="flex items-center gap-2 text-text-secondary">
                                <Icon name="Phone" size={14} />
                                <span>{client.primaryPhone || 'No Phone'}</span>
                            </div>
                        </div>
                        <Button variant="secondary" className="w-full mt-6" size="sm">Send Message</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientOverview;
