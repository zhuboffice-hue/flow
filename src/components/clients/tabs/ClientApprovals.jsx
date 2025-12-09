import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';
import Icon from '../../ui/Icon';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Select from '../../ui/Select';

const ApprovalCard = ({ approval, onUpdateStatus }) => (
    <div className="bg-surface p-4 rounded-lg border border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${approval.status === 'Pending' ? 'bg-warning/10 text-warning' :
                approval.status === 'Approved' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                }`}>
                <Icon name={approval.status === 'Pending' ? 'Clock' : approval.status === 'Approved' ? 'CheckCircle' : 'XCircle'} size={20} />
            </div>
            <div>
                <h4 className="font-medium text-text-primary">{approval.title}</h4>
                <p className="text-xs text-text-secondary">{approval.type} • Requested by {approval.requestedBy} • {new Date(approval.createdAt?.seconds * 1000).toLocaleDateString()}</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <Badge variant={approval.status === 'Pending' ? 'warning' : approval.status === 'Approved' ? 'success' : 'danger'}>{approval.status}</Badge>
            {approval.status === 'Pending' && (
                <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="text-danger hover:text-danger hover:bg-danger/10" onClick={() => onUpdateStatus(approval.id, 'Declined')}>Decline</Button>
                    <Button size="sm" variant="ghost" className="text-success hover:text-success hover:bg-success/10" onClick={() => onUpdateStatus(approval.id, 'Approved')}>Approve</Button>
                </div>
            )}
        </div>
    </div>
);

const ClientApprovals = ({ clientId }) => {
    const [approvals, setApprovals] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newApproval, setNewApproval] = useState({
        title: '',
        type: 'Document',
        requestedBy: 'You'
    });

    useEffect(() => {
        if (!clientId) return;

        const unsubscribe = onSnapshot(collection(db, 'clients', clientId, 'approvals'), (snapshot) => {
            const approvalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setApprovals(approvalsData);
        });
        return () => unsubscribe();
    }, [clientId]);

    const handleRequestApproval = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'clients', clientId, 'approvals'), {
                ...newApproval,
                status: 'Pending',
                createdAt: new Date()
            });
            setIsModalOpen(false);
            setNewApproval({ title: '', type: 'Document', requestedBy: 'You' });
        } catch (error) {
            console.error("Error requesting approval:", error);
        }
    };

    const handleUpdateStatus = async (approvalId, status) => {
        try {
            await updateDoc(doc(db, 'clients', clientId, 'approvals', approvalId), { status });
        } catch (error) {
            console.error("Error updating approval status:", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-text-primary">Approvals</h3>
                <Button size="sm" onClick={() => setIsModalOpen(true)}><Icon name="Plus" size={14} className="mr-2" /> Request Approval</Button>
            </div>

            {approvals.length === 0 ? (
                <div className="text-center py-12 text-text-secondary bg-surface rounded-lg border border-border">
                    <Icon name="CheckSquare" size={48} className="mx-auto mb-4 text-muted" />
                    <p>No approvals pending.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {approvals.map(approval => (
                        <ApprovalCard key={approval.id} approval={approval} onUpdateStatus={handleUpdateStatus} />
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Request Approval"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleRequestApproval}>Request</Button>
                    </div>
                }
            >
                <form className="space-y-4">
                    <Input
                        label="Title"
                        value={newApproval.title}
                        onChange={(e) => setNewApproval({ ...newApproval, title: e.target.value })}
                        required
                    />
                    <Select
                        label="Type"
                        value={newApproval.type}
                        onChange={(e) => setNewApproval({ ...newApproval, type: e.target.value })}
                        options={[
                            { value: 'Document', label: 'Document' },
                            { value: 'Design', label: 'Design' },
                            { value: 'Finance', label: 'Finance' },
                            { value: 'Other', label: 'Other' }
                        ]}
                    />
                </form>
            </Modal>
        </div>
    );
};

export default ClientApprovals;
