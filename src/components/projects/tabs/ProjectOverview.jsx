import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Icon from '../../ui/Icon';
import Avatar from '../../ui/Avatar';
import { useCurrency } from '../../../hooks/useCurrency';

const ProjectOverview = ({ project }) => {
    const { formatCurrency } = useCurrency();
    const [client, setClient] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Client
                if (project.clientId) {
                    const clientDoc = await getDoc(doc(db, 'clients', project.clientId));
                    if (clientDoc.exists()) {
                        setClient({ id: clientDoc.id, ...clientDoc.data() });
                    }
                }

                // Fetch Team Members
                if (project.team && project.team.length > 0) {
                    const members = await Promise.all(
                        project.team.map(async (memberId) => {
                            // Try fetching from employees collection first
                            const employeeDoc = await getDoc(doc(db, 'employees', memberId));
                            if (employeeDoc.exists()) {
                                return { id: employeeDoc.id, ...employeeDoc.data() };
                            }
                            // Fallback to users collection if not found in employees (e.g. for admins)
                            const userDoc = await getDoc(doc(db, 'users', memberId));
                            if (userDoc.exists()) {
                                return { id: userDoc.id, ...userDoc.data() };
                            }
                            return null;
                        })
                    );
                    setTeamMembers(members.filter(m => m !== null));
                }
            } catch (error) {
                console.error("Error fetching project details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (project) {
            fetchData();
        }
    }, [project]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <section>
                        <h3 className="text-lg font-semibold text-text-primary mb-3">Description</h3>
                        <div className="bg-surface p-4 rounded-lg border border-border text-text-secondary whitespace-pre-wrap min-h-[100px]">
                            {project.description || 'No description provided.'}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold text-text-primary mb-3">Team</h3>
                        <div className="bg-surface p-4 rounded-lg border border-border">
                            {loading ? (
                                <div className="text-sm text-text-secondary">Loading team...</div>
                            ) : teamMembers.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {teamMembers.map(member => (
                                        <div key={member.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors">
                                            <Avatar
                                                src={member.photoURL || member.avatar}
                                                fallback={member.name?.charAt(0)}
                                                size="md"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-text-primary">{member.name}</p>
                                                <p className="text-xs text-text-secondary">{member.role || 'Member'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-text-secondary">
                                    <Icon name="Users" size={24} className="mx-auto mb-2 opacity-50" />
                                    <p>No team members assigned.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <div className="space-y-6">
                    <section>
                        <h3 className="text-lg font-semibold text-text-primary mb-3">Details</h3>
                        <div className="bg-surface p-4 rounded-lg border border-border space-y-4">
                            <div>
                                <label className="text-xs font-medium text-text-secondary uppercase">Client</label>
                                <div className="flex items-center gap-2 mt-1">
                                    {loading ? (
                                        <span className="text-sm text-text-secondary">Loading...</span>
                                    ) : client ? (
                                        <>
                                            <Avatar
                                                src={client.logo}
                                                fallback={client.name?.charAt(0)}
                                                size="sm"
                                                className="w-6 h-6 text-xs"
                                            />
                                            <p className="text-text-primary font-medium">{client.name}</p>
                                        </>
                                    ) : (
                                        <p className="text-text-secondary italic">No client assigned</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-secondary uppercase">Start Date</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Icon name="Calendar" size={14} className="text-muted" />
                                    <p className="text-text-primary font-medium">{formatDate(project.startDate)}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-secondary uppercase">End Date</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Icon name="Calendar" size={14} className="text-muted" />
                                    <p className="text-text-primary font-medium">{formatDate(project.endDate)}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-secondary uppercase">Budget</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Icon name="DollarSign" size={14} className="text-muted" />
                                    <p className="text-text-primary font-medium">
                                        {formatCurrency(project.budget, project.currency)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ProjectOverview;
