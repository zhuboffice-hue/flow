import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

const InviteMemberModal = ({ isOpen, onClose, onSuccess }) => {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        role: 'Viewer',
        department: 'Engineering'
    });
    const [loading, setLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState('');

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Create invitation doc
            const inviteRef = await addDoc(collection(db, 'invitations'), {
                ...formData,
                status: 'pending',
                createdAt: new Date(),
                companyId: currentUser.companyId,
                companyName: currentUser.company?.name || 'Company',
            });

            // Generate link
            const link = `${window.location.origin}/invite/${inviteRef.id}`;
            setInviteLink(link);

            // Open Gmail Draft
            const subject = encodeURIComponent(`Join ${formData.companyName || 'our team'} on Flow`);
            const body = encodeURIComponent(`Hi ${formData.name},\n\nI'd like to invite you to join our team on Flow.\n\nPlease accept the invitation using this link:\n${link}\n\nBest,\n${currentUser?.name || 'The Team'}`);

            window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${formData.email}&su=${subject}&body=${body}`, '_blank');

            // Also create employee record as 'Invited'
            await addDoc(collection(db, 'employees'), {
                ...formData,
                companyId: currentUser.companyId,
                status: 'Invited',
                joinedAt: new Date(),
                avatar: null,
                skills: [],
                workload: 0,
                availability: 'Available'
            });

            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Error inviting member:", error);
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        alert("Invite link copied to clipboard!");
        onClose();
        setFormData({ email: '', name: '', role: 'Viewer', department: 'Engineering' });
        setInviteLink('');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Invite Team Member"
            footer={
                <div className="flex justify-end gap-2">
                    {inviteLink ? (
                        <Button onClick={copyLink}>Copy Link & Close</Button>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Generating Invite...' : 'Send Invite'}
                            </Button>
                        </>
                    )}
                </div>
            }
        >
            {inviteLink ? (
                <div className="text-center space-y-4">
                    <div className="bg-success/10 text-success p-4 rounded-lg flex items-center justify-center gap-2">
                        <Icon name="CheckCircle" size={20} />
                        <span className="font-medium">Invitation Created!</span>
                    </div>
                    <p className="text-sm text-text-secondary">
                        Share this link with <strong>{formData.email}</strong> to let them join the team.
                    </p>
                    <div className="bg-surface-secondary p-3 rounded border border-border text-sm break-all font-mono select-all">
                        {inviteLink}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <Input
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="colleague@company.com"
                    />
                    <Input
                        label="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                    />
                    <Select
                        label="Role"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        options={[
                            { value: 'Admin', label: 'Admin' },
                            { value: 'Editor', label: 'Editor' },
                            { value: 'Viewer', label: 'Viewer' }
                        ]}
                    />
                    <Select
                        label="Department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        options={[
                            { value: 'Engineering', label: 'Engineering' },
                            { value: 'Design', label: 'Design' },
                            { value: 'Product', label: 'Product' },
                            { value: 'Marketing', label: 'Marketing' },
                            { value: 'Sales', label: 'Sales' },
                            { value: 'HR', label: 'HR' }
                        ]}
                    />
                </div>
            )}
        </Modal>
    );
};

export default InviteMemberModal;
