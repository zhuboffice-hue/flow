import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/ThreePaneLayout';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import Badge from '../../components/ui/Badge';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const AutomationDashboard = () => {
    const navigate = useNavigate();
    const [automations, setAutomations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        const q = query(collection(db, 'automations'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const automationData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAutomations(automationData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredAutomations = filterStatus === 'All'
        ? automations
        : automations.filter(a => a.status === filterStatus);

    return (
        <Layout>
            <div className="space-y-6">
                <div className="mb-6">
                    <h1 className="text-h1 font-bold text-text-primary">Automations</h1>
                    <p className="text-text-secondary">Manage your automated workflows.</p>
                </div>

                {/* Header Actions */}
                <div className="flex justify-between items-center">
                    <div className="flex gap-4">
                        <div className="relative">
                            <Icon name="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={16} />
                            <input
                                type="text"
                                placeholder="Search automations..."
                                className="pl-9 pr-4 py-2 bg-surface border border-border rounded-md text-sm focus:outline-none focus:border-primary w-64"
                            />
                        </div>
                        <select
                            className="bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="All">All Status</option>
                            <option value="enabled">Enabled</option>
                            <option value="disabled">Disabled</option>
                        </select>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => navigate('/app/automation/logs')}>
                            <Icon name="List" className="mr-2" size={16} />
                            Logs
                        </Button>
                        <Button onClick={() => navigate('/app/automation/create')}>
                            <Icon name="Plus" className="mr-2" size={16} />
                            Create Automation
                        </Button>
                    </div>
                </div>

                {/* Automations List */}
                <div className="bg-surface rounded-lg border border-border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-surface-secondary border-b border-border">
                            <tr>
                                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Automation Name</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Trigger</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Last Run</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Status</th>
                                <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-text-secondary">Loading automations...</td>
                                </tr>
                            ) : filteredAutomations.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-text-secondary">
                                        <div className="flex flex-col items-center gap-2">
                                            <Icon name="Zap" size={24} className="text-text-secondary opacity-50" />
                                            <p>No automations found</p>
                                            <Button size="sm" variant="outline" onClick={() => navigate('/automation/create')}>Create your first automation</Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAutomations.map(automation => (
                                    <tr key={automation.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                                        <td className="py-3 px-4">
                                            <div>
                                                <p className="font-medium text-text-primary">{automation.name}</p>
                                                <p className="text-xs text-text-secondary truncate max-w-xs">{automation.description}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant="secondary" className="font-mono text-xs">
                                                {automation.trigger?.type || 'Unknown'}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-text-secondary">
                                            {automation.lastRun ? new Date(automation.lastRun.seconds * 1000).toLocaleString() : 'Never'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant={automation.status === 'enabled' ? 'success' : 'secondary'}>
                                                {automation.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/app/automation/${automation.id}`)}
                                                    className="p-1 text-text-secondary hover:text-primary transition-colors"
                                                >
                                                    <Icon name="Edit" size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default AutomationDashboard;
