import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Table from '../../ui/Table';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';
import Icon from '../../ui/Icon';
import CreateProjectModal from '../../projects/CreateProjectModal';

const ClientProjects = ({ clientId }) => {
    const [projects, setProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!clientId) return;

        const q = query(collection(db, 'projects'), where('clientId', '==', clientId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProjects(projectsData);
        });
        return () => unsubscribe();
    }, [clientId]);

    const columns = [
        { key: 'name', header: 'Project Name', accessor: 'name', cell: (row) => <span className="font-medium">{row.name}</span> },
        {
            key: 'status',
            header: 'Status',
            accessor: 'status',
            cell: (row) => {
                const variants = { 'In Progress': 'primary', 'Planning': 'warning', 'Completed': 'success' };
                return <Badge variant={variants[row.status] || 'default'}>{row.status}</Badge>;
            }
        },
        { key: 'deadline', header: 'Deadline', accessor: 'deadline' },
        {
            key: 'progress',
            header: 'Progress',
            accessor: 'progress',
            cell: (row) => (
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${row.progress}%` }}></div>
                </div>
            )
        },
        {
            key: 'team',
            header: 'Team',
            accessor: 'team',
            cell: (row) => (
                <div className="flex -space-x-2">
                    {[...Array(Math.min(row.team || 1, 3))].map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-surface flex items-center justify-center text-[10px]">
                            U{i + 1}
                        </div>
                    ))}
                </div>
            )
        },
        {
            key: 'actions',
            header: '',
            accessor: 'actions',
            cell: () => (
                <Button variant="ghost" size="icon"><Icon name="ChevronRight" size={16} /></Button>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-text-primary">Projects</h3>
                <Button size="sm" onClick={() => setIsModalOpen(true)}><Icon name="Plus" size={14} className="mr-2" /> Create Project</Button>
            </div>

            {projects.length === 0 ? (
                <div className="text-center py-8 text-text-secondary bg-surface rounded-lg border border-border">
                    <p>No projects found for this client.</p>
                </div>
            ) : (
                <div className="bg-surface rounded-lg border border-border overflow-hidden">
                    <Table data={projects} columns={columns} />
                </div>
            )}

            <CreateProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                clientId={clientId}
            />
        </div>
    );
};

export default ClientProjects;
