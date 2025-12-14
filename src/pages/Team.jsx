import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ThreePaneLayout from '../components/layout/ThreePaneLayout';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import PeopleGrid from '../components/people/PeopleGrid';
import PeopleTable from '../components/people/PeopleTable';
import InviteMemberModal from '../components/people/InviteMemberModal';
import MessageModal from '../components/messaging/MessageModal';
import { useAuth } from '../context/AuthContext';

import { useNavigate } from 'react-router-dom';

const Team = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [selectedRecipient, setSelectedRecipient] = useState(null);

    const [filterDepartment, setFilterDepartment] = useState('All');
    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        if (!currentUser?.companyId) return;

        // Fetch Employees
        const qEmployees = query(collection(db, 'employees'), where('companyId', '==', currentUser.companyId));
        const unsubscribeEmployees = onSnapshot(qEmployees, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEmployees(data);
        });

        // Fetch Departments
        const qDepartments = query(collection(db, 'departments'), where('companyId', '==', currentUser.companyId));
        const unsubscribeDepartments = onSnapshot(qDepartments, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDepartments(data);
        });

        return () => {
            unsubscribeEmployees();
            unsubscribeDepartments();
        };
    }, [currentUser]);

    const filteredEmployees = filterDepartment === 'All'
        ? employees
        : employees.filter(e => e.department === filterDepartment);

    const handleProfileClick = (id) => {
        navigate(`/app/team/${id}`);
    };

    const handleMessageClick = (employee) => {
        setSelectedRecipient(employee);
        setIsMessageModalOpen(true);
    };

    return (
        <ThreePaneLayout>
            <div className="flex flex-col h-full p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-h2 font-bold text-text-primary">People</h1>
                        <p className="text-text-secondary">Manage your team, view workloads, and track performance.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-surface rounded-md border border-border p-0.5">
                            <button
                                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                                onClick={() => setViewMode('grid')}
                            >
                                <Icon name="LayoutGrid" size={18} />
                            </button>
                            <button
                                className={`p-2 rounded ${viewMode === 'table' ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                                onClick={() => setViewMode('table')}
                            >
                                <Icon name="List" size={18} />
                            </button>
                        </div>
                        <Button onClick={() => setIsInviteModalOpen(true)}>
                            <Icon name="UserPlus" size={16} className="mr-2" /> Invite Member
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    <button
                        onClick={() => setFilterDepartment('All')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filterDepartment === 'All'
                            ? 'bg-primary text-white'
                            : 'bg-surface border border-border text-text-secondary hover:bg-surface-hover'
                            }`}
                    >
                        All
                    </button>
                    {departments.map(dept => (
                        <button
                            key={dept.id}
                            onClick={() => setFilterDepartment(dept.name)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filterDepartment === dept.name
                                ? 'bg-primary text-white'
                                : 'bg-surface border border-border text-text-secondary hover:bg-surface-hover'
                                }`}
                        >
                            {dept.name}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {employees.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icon name="Users" size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-text-primary">No team members yet</h3>
                            <p className="text-text-secondary mb-4">Invite your first team member to get started.</p>
                            <Button onClick={() => setIsInviteModalOpen(true)}>Invite Member</Button>
                        </div>
                    ) : (
                        viewMode === 'grid' ? (
                            <PeopleGrid
                                employees={filteredEmployees}
                                onProfileClick={handleProfileClick}
                                onMessageClick={handleMessageClick}
                            />
                        ) : (
                            <PeopleTable
                                employees={filteredEmployees}
                                onProfileClick={handleProfileClick}
                                onMessageClick={handleMessageClick}
                            />
                        )
                    )}
                </div>
            </div>

            <InviteMemberModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onSuccess={() => { }}
            />

            <MessageModal
                isOpen={isMessageModalOpen}
                onClose={() => setIsMessageModalOpen(false)}
                recipientId={selectedRecipient?.uid}
                recipientName={selectedRecipient?.name}
                recipientEmail={selectedRecipient?.email}
            />
        </ThreePaneLayout>
    );
};

export default Team;
