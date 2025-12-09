import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Icon from '../../ui/Icon';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Select from '../../ui/Select';

const TimelineItem = ({ log }) => {
    const iconMap = {
        email: 'Mail',
        call: 'Phone',
        meeting: 'Users',
        note: 'FileText'
    };
    const colorMap = {
        email: 'bg-blue-100 text-blue-600',
        call: 'bg-green-100 text-green-600',
        meeting: 'bg-purple-100 text-purple-600',
        note: 'bg-gray-100 text-gray-600'
    };

    return (
        <div className="flex gap-4">
            <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorMap[log.type] || colorMap.note}`}>
                    <Icon name={iconMap[log.type] || 'FileText'} size={14} />
                </div>
                <div className="w-px h-full bg-border my-2"></div>
            </div>
            <div className="pb-8">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-text-primary text-small">{log.user}</span>
                    <span className="text-xs text-text-secondary">{new Date(log.createdAt?.seconds * 1000).toLocaleString()}</span>
                </div>
                <p className="text-small text-text-secondary">{log.summary}</p>
            </div>
        </div>
    );
};

const ClientCommunication = ({ clientId }) => {
    const [logs, setLogs] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newLog, setNewLog] = useState({
        type: 'call',
        summary: '',
        user: 'You' // In a real app, get from auth context
    });

    useEffect(() => {
        if (!clientId) return;

        const unsubscribe = onSnapshot(collection(db, 'clients', clientId, 'communication'), (snapshot) => {
            const logsData = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => b.createdAt - a.createdAt);
            setLogs(logsData);
        });
        return () => unsubscribe();
    }, [clientId]);

    const handleLogCommunication = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'clients', clientId, 'communication'), {
                ...newLog,
                createdAt: new Date()
            });
            setIsModalOpen(false);
            setNewLog({ type: 'call', summary: '', user: 'You' });
        } catch (error) {
            console.error("Error logging communication:", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-text-primary">Communication Log</h3>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => { setNewLog({ ...newLog, type: 'call' }); setIsModalOpen(true); }}><Icon name="Phone" size={14} className="mr-2" /> Log Call</Button>
                    <Button size="sm" onClick={() => { setNewLog({ ...newLog, type: 'email' }); setIsModalOpen(true); }}><Icon name="Mail" size={14} className="mr-2" /> Log Email</Button>
                </div>
            </div>

            <div className="bg-surface p-6 rounded-lg border border-border">
                {logs.length === 0 ? (
                    <p className="text-center text-text-secondary">No communication logged yet.</p>
                ) : (
                    logs.map(log => (
                        <TimelineItem key={log.id} log={log} />
                    ))
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Log Communication"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleLogCommunication}>Save Log</Button>
                    </div>
                }
            >
                <form className="space-y-4">
                    <Select
                        label="Type"
                        value={newLog.type}
                        onChange={(e) => setNewLog({ ...newLog, type: e.target.value })}
                        options={[
                            { value: 'call', label: 'Call' },
                            { value: 'email', label: 'Email' },
                            { value: 'meeting', label: 'Meeting' },
                            { value: 'note', label: 'Note' }
                        ]}
                    />
                    <div>
                        <label className="block text-small font-medium text-text-primary mb-1.5">Summary</label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-border bg-surface px-3 py-2 text-body ring-offset-background placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            value={newLog.summary}
                            onChange={(e) => setNewLog({ ...newLog, summary: e.target.value })}
                            required
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ClientCommunication;
