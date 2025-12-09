import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/ui/Icon';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import InviteMemberModal from '../../components/people/InviteMemberModal';

const TeamSettings = () => {
    const { currentUser } = useAuth();
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        // Fetch from 'employees' collection to match People module
        const q = collection(db, 'employees');
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTeamMembers(data);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching team:", err);
            setError("Failed to load team members.");
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleInviteSuccess = () => {
        setSuccess('Invitation sent successfully!');
        setIsInviteModalOpen(false);
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm("Are you sure you want to remove this user from the team? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, 'employees', userId));
                setSuccess('User removed successfully.');
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                console.error("Error deleting user:", err);
                setError("Failed to remove user.");
                setTimeout(() => setError(''), 3000);
            }
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-text-secondary">Loading team members...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-surface p-6 rounded-lg border border-border">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-text-primary">Team Members</h3>
                        <p className="text-sm text-text-secondary">Manage access and roles for your team.</p>
                    </div>
                    <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-dark transition-colors flex items-center gap-2"
                    >
                        <Icon name="Plus" size={16} />
                        Invite Member
                    </button>
                </div>

                {success && (
                    <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm flex items-center gap-2">
                        <Icon name="CheckCircle" size={16} />
                        {success}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm flex items-center gap-2">
                        <Icon name="AlertCircle" size={16} />
                        {error}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-surface-secondary">
                            <tr>
                                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">User</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Role</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Status</th>
                                <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamMembers.map((member) => (
                                <tr key={member.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs overflow-hidden">
                                                {member.photoURL || member.avatar ? (
                                                    <img src={member.photoURL || member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    (member.name || 'U').charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-text-primary text-sm">{member.name || 'Unknown User'}</p>
                                                <p className="text-xs text-text-secondary">{member.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="text-sm text-text-primary">{member.role || 'Member'}</span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            Active
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <button
                                            onClick={() => handleDeleteUser(member.id)}
                                            className="text-text-secondary hover:text-red-500 transition-colors"
                                            title="Remove User"
                                        >
                                            <Icon name="Trash2" size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {teamMembers.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-8 text-center text-text-secondary">No team members found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <InviteMemberModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onSuccess={handleInviteSuccess}
            />
        </div>
    );
};

export default TeamSettings;
