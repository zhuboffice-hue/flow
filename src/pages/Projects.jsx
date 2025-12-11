import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, getDocs, deleteDoc, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import ThreePaneLayout from '../components/layout/ThreePaneLayout';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import ProjectsStats from '../components/projects/ProjectsStats';
import ProjectCard from '../components/projects/ProjectCard';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import { useAuth } from '../context/AuthContext';

const Projects = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState('grid'); // 'grid' | 'list'
    const [projects, setProjects] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [clientsMap, setClientsMap] = useState({});

    useEffect(() => {
        if (!currentUser?.companyId) return;

        const fetchProjectsAndClients = async () => {
            // 1. Fetch Clients Map
            try {
                // Filter by companyId
                const clientsQ = query(collection(db, 'clients'), where('companyId', '==', currentUser.companyId));
                const clientsSnap = await getDocs(clientsQ);
                const map = {};
                clientsSnap.docs.forEach(c => map[c.id] = c.data().name);
                setClientsMap(map);
            } catch (e) {
                console.error("Error fetching clients:", e);
            }

            // 2. Subscribe to Projects
            // Note: subscribing inside async function is fine, but need to handle unsubscribe correctly.
            // Better to keep subscription separate or just use onSnapshot for both if real-time needed.
            // For now, let's keep projects real-time and clients one-off (optimization).
        };
        fetchProjectsAndClients();

        // Filter by companyId
        const q = query(collection(db, 'projects'), where('companyId', '==', currentUser.companyId));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Client-side sort
            projectsData.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA; // Descending
            });

            // Calculate Progress for each project
            const projectsWithProgress = await Promise.all(projectsData.map(async (project) => {
                try {
                    const tasksRef = collection(db, 'projects', project.id, 'tasks');
                    const tasksSnap = await getDocs(tasksRef);
                    const tasks = tasksSnap.docs.map(t => t.data());

                    const totalTasks = tasks.length;
                    const completedTasks = tasks.filter(t => t.completed || t.status === 'Completed' || t.status === 'Done').length;
                    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                    return { ...project, progress, taskCount: totalTasks, completedCount: completedTasks };
                } catch (err) {
                    console.error(`Error fetching tasks for project ${project.id}:`, err);
                    return { ...project, progress: 0, taskCount: 0, completedCount: 0 };
                }
            }));

            setProjects(projectsWithProgress);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleStatusChange = async (projectId, newStatus) => {
        try {
            await updateDoc(doc(db, 'projects', projectId), { status: newStatus });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleDeleteProject = async (projectId) => {
        if (window.confirm("Are you sure you want to delete this project?")) {
            try {
                await deleteDoc(doc(db, 'projects', projectId));
                setProjects(prev => prev.filter(p => p.id !== projectId));
            } catch (error) {
                console.error("Error deleting project:", error);
            }
        }
    };

    const columns = [
        { key: 'name', header: 'Project Name', accessor: 'name', cell: (_, row) => <span className="font-medium text-text-primary cursor-pointer hover:underline" onClick={() => row?.id && navigate(`/app/projects/${row.id}`)}>{row?.name || 'Untitled'}</span> },
        { key: 'client', header: 'Client', accessor: 'clientId', cell: (_, row) => <span className="text-text-secondary">{row?.clientId && clientsMap[row.clientId] ? clientsMap[row.clientId] : '-'}</span> },
        {
            key: 'status',
            header: 'Status',
            accessor: 'status',
            cell: (_, row) => {
                const variants = { 'In Progress': 'bg-primary/10 text-primary', 'Planning': 'bg-warning/10 text-warning', 'Completed': 'bg-success/10 text-success', 'On Hold': 'bg-gray-100 text-gray-600', 'Draft': 'bg-gray-100 text-gray-600' };
                const currentStatus = row?.status || 'Draft';
                return (
                    <select
                        className={`text-xs font-medium px-2 py-1 rounded-full border-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer ${variants[currentStatus] || variants['Draft']}`}
                        value={currentStatus}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusChange(row.id, e.target.value)}
                    >
                        <option value="Draft">Draft</option>
                        <option value="Planning">Planning</option>
                        <option value="In Progress">In Progress</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                    </select>
                );
            }
        },
        {
            key: 'progress',
            header: 'Progress',
            accessor: 'progress',
            cell: (_, row) => (
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${row?.progress || 0}%` }}></div>
                </div>
            )
        },
        { key: 'endDate', header: 'Due Date', accessor: 'endDate', cell: (_, row) => row?.endDate ? new Date(row.endDate).toLocaleDateString() : '-' },
        {
            key: 'actions',
            header: '',
            accessor: 'actions',
            cell: (_, row) => (
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => row?.id && navigate(`/app/projects/${row.id}`)} title="Edit">
                        <Icon name="Edit" size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-danger hover:bg-danger/10" onClick={() => row?.id && handleDeleteProject(row.id)} title="Delete">
                        <Icon name="Trash2" size={16} />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <ThreePaneLayout
            leftPanel={
                <div className="p-4 space-y-6">
                    <div>
                        <h3 className="font-semibold text-text-primary mb-2">Filters</h3>
                        <div className="space-y-2">
                            {/* Placeholder filters */}
                            <div className="flex items-center gap-2 text-sm text-text-secondary"><input type="checkbox" /> Active</div>
                            <div className="flex items-center gap-2 text-sm text-text-secondary"><input type="checkbox" /> Completed</div>
                        </div>
                    </div>
                </div>
            }
            rightPanel={
                <div className="p-4">
                    <h3 className="font-semibold text-text-primary mb-4">Recent Activity</h3>
                    <div className="text-sm text-text-secondary">No recent activity.</div>
                </div>
            }
        >
            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-h2 font-bold text-text-primary">Projects</h1>
                        <p className="text-text-secondary">Manage and track all your projects</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex bg-surface rounded-md border border-border p-1 flex-1 md:flex-none justify-center">
                            <button
                                onClick={() => setView('list')}
                                className={`p-1.5 rounded flex-1 md:flex-none flex justify-center ${view === 'list' ? 'bg-gray-100 text-text-primary' : 'text-muted hover:text-text-primary'}`}
                                title="List View"
                            >
                                <Icon name="List" size={18} />
                            </button>
                            <button
                                onClick={() => setView('grid')}
                                className={`p-1.5 rounded flex-1 md:flex-none flex justify-center ${view === 'grid' ? 'bg-gray-100 text-text-primary' : 'text-muted hover:text-text-primary'}`}
                                title="Grid View"
                            >
                                <Icon name="LayoutGrid" size={18} />
                            </button>
                        </div>
                        {/* Desktop Button */}
                        <div className="hidden md:block">
                            <Button icon="Plus" onClick={() => setIsCreateModalOpen(true)}>New Project</Button>
                        </div>
                    </div>
                </div>

                {/* Mobile Floating Action Button */}
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-primary-dark transition-colors"
                >
                    <Icon name="Plus" size={24} />
                </button>

                <ProjectsStats projects={projects} />

                {loading ? (
                    <div className="text-center py-12">Loading projects...</div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-12 bg-surface rounded-lg border border-border">
                        <Icon name="Folder" size={48} className="mx-auto mb-4 text-muted" />
                        <h3 className="text-lg font-medium text-text-primary">No projects yet</h3>
                        <p className="text-text-secondary mb-4">Create your first project to get started.</p>
                        <Button onClick={() => setIsCreateModalOpen(true)}>Create Project</Button>
                    </div>
                ) : (
                    view === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map(project => (
                                <ProjectCard key={project.id} project={project} onClick={() => navigate(`/app/projects/${project.id}`)} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-surface rounded-lg border border-border overflow-hidden">
                            <Table columns={columns} data={projects} />
                        </div>
                    )
                )}

                <CreateProjectModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    clientId="" // Optional: if we want to pre-select a client
                    onSuccess={() => console.log('Project created')}
                />
            </div>
        </ThreePaneLayout>
    );
};

export default Projects;
