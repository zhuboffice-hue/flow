import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { initialApprovalState } from '../../../lib/models';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Badge from '../../ui/Badge';
import Icon from '../../ui/Icon';
import Avatar from '../../ui/Avatar';

const ApprovalManager = ({ taskId, projectId, employees = [], taskTitle = '' }) => {
    const { currentUser } = useAuth();
    const [approvals, setApprovals] = useState([]);
    const [isRequesting, setIsRequesting] = useState(false);
    const [requestToId, setRequestToId] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (!taskId || !projectId) return;

        const q = query(collection(db, 'projects', projectId, 'tasks', taskId, 'approvals'), orderBy('requestedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setApprovals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [taskId, projectId]);

    const handleRequestApproval = async () => {
        if (!requestToId || !currentUser) return;

        const selectedEmployee = employees.find(e => e.id === requestToId);
        const requestToName = selectedEmployee ? selectedEmployee.name : 'Unknown';
        const requestToEmail = selectedEmployee ? selectedEmployee.email : '';

        try {
            // 1. Create Approval Request
            await addDoc(collection(db, 'projects', projectId, 'tasks', taskId, 'approvals'), {
                ...initialApprovalState,
                taskId,
                requestedBy: currentUser.uid,
                requestedByName: currentUser.displayName || currentUser.email,
                requestedByAvatar: currentUser.photoURL,
                requestedToId: requestToId,
                requestedTo: requestToName, // Keep for display
                requestedToEmail: requestToEmail,
                notes,
                requestedAt: new Date()
            });

            // 2. Send Notification
            if (requestToEmail) {
                await addDoc(collection(db, 'notifications'), {
                    recipientId: requestToId,
                    recipientEmail: requestToEmail,
                    senderName: currentUser.displayName || currentUser.email,
                    content: `Approval requested for task: "${taskTitle || 'Untitled'}"`,
                    isRead: false,
                    createdAt: new Date(),
                    type: 'approval',
                    link: `/app/projects/${projectId}?taskId=${taskId}`
                });
            }

            // 3. Update Task Status to "Review"
            await updateDoc(doc(db, 'projects', projectId, 'tasks', taskId), {
                status: 'Review',
                updatedAt: new Date()
            });

            setIsRequesting(false);
            setRequestToId('');
            setNotes('');
        } catch (error) {
            console.error("Error requesting approval:", error);
        }
    };

    const handleUpdateStatus = async (approvalId, status) => {
        try {
            await updateDoc(doc(db, 'projects', projectId, 'tasks', taskId, 'approvals', approvalId), {
                status,
                resolvedAt: new Date(),
                resolvedBy: currentUser.uid
            });

            // Update Task Status based on approval
            if (status === 'approved') {
                await updateDoc(doc(db, 'projects', projectId, 'tasks', taskId), {
                    status: 'Done',
                    updatedAt: new Date()
                });
            } else if (status === 'declined') {
                await updateDoc(doc(db, 'projects', projectId, 'tasks', taskId), {
                    status: 'In Progress', // Revert to In Progress if declined
                    updatedAt: new Date()
                });
            }

        } catch (error) {
            console.error("Error updating approval status:", error);
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            pending: 'warning',
            approved: 'success',
            declined: 'danger'
        };
        return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-medium text-text-primary">Approvals</h3>
                {!isRequesting && (
                    <Button size="sm" onClick={() => setIsRequesting(true)}>
                        <Icon name="ShieldCheck" size={14} className="mr-2" /> Request Approval
                    </Button>
                )}
            </div>

            {isRequesting && (
                <div className="bg-surface-secondary p-4 rounded-lg border border-border space-y-3">
                    <h4 className="text-sm font-medium text-text-primary">New Request</h4>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Request To</label>
                        <select
                            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary transition-colors text-sm"
                            value={requestToId}
                            onChange={(e) => setRequestToId(e.target.value)}
                        >
                            <option value="">Select Approver</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.name} ({emp.email})
                                </option>
                            ))}
                        </select>
                    </div>
                    <Input
                        label="Notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Please review this task..."
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsRequesting(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleRequestApproval} disabled={!requestToId}>Send Request</Button>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {approvals.length === 0 && !isRequesting && (
                    <div className="text-center py-6 text-text-secondary">
                        <p>No approvals requested.</p>
                    </div>
                )}

                {approvals.map(approval => {
                    // Check both ID and Email for permission
                    const canApprove = currentUser && (
                        approval.requestedToId === currentUser.uid ||
                        (approval.requestedToEmail && approval.requestedToEmail === currentUser.email)
                    );

                    return (
                        <div key={approval.id} className="bg-surface border border-border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <Avatar
                                        size="sm"
                                        src={approval.requestedByAvatar}
                                        fallback={approval.requestedByName?.charAt(0)}
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-text-primary">
                                            Request to: {approval.requestedTo}
                                        </div>
                                        <div className="text-xs text-muted">
                                            {approval.requestedAt?.toDate().toLocaleDateString()} • By {approval.requestedByName}
                                        </div>
                                    </div>
                                </div>
                                {getStatusBadge(approval.status)}
                            </div>

                            {approval.notes && (
                                <p className="text-sm text-text-secondary mb-4 bg-surface-secondary p-2 rounded">
                                    "{approval.notes}"
                                </p>
                            )}

                            {approval.status === 'pending' && (
                                <div className="flex gap-2 pt-2 border-t border-border">
                                    {canApprove ? (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="success"
                                                className="flex-1"
                                                onClick={() => handleUpdateStatus(approval.id, 'approved')}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                className="flex-1"
                                                onClick={() => handleUpdateStatus(approval.id, 'declined')}
                                            >
                                                Decline
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="w-full text-center text-xs text-text-secondary italic">
                                            Waiting for approval from {approval.requestedTo}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ApprovalManager;
