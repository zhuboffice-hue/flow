import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/ThreePaneLayout';
import Icon from '../../components/ui/Icon';
import Badge from '../../components/ui/Badge';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const AutomationLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'automationLogs'), orderBy('timestamp', 'desc'), limit(50));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setLogs(logData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <Layout>
            <div className="mb-6">
                <h1 className="text-h1 font-bold text-text-primary">Automation Logs</h1>
                <p className="text-text-secondary">View execution history.</p>
            </div>
            <div className="bg-surface rounded-lg border border-border overflow-hidden">
                <div className="p-4 border-b border-border">
                    <h2 className="font-bold text-text-primary">Execution History</h2>
                </div>
                <table className="w-full">
                    <thead className="bg-surface-secondary border-b border-border">
                        <tr>
                            <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Timestamp</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Automation</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Status</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="4" className="py-8 text-center text-text-secondary">Loading logs...</td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="py-8 text-center text-text-secondary">No logs found.</td>
                            </tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                                    <td className="py-3 px-4 text-sm text-text-secondary">
                                        {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'N/A'}
                                    </td>
                                    <td className="py-3 px-4 text-sm font-medium text-text-primary">
                                        {log.automationName || 'Unknown Automation'}
                                    </td>
                                    <td className="py-3 px-4">
                                        <Badge variant={log.status === 'success' ? 'success' : 'danger'}>
                                            {log.status}
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-text-secondary">
                                        {log.details}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Layout>
    );
};

export default AutomationLogs;
