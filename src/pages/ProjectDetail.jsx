import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ThreePaneLayout from '../components/layout/ThreePaneLayout';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Badge from '../components/ui/Badge';
import ProjectOverview from '../components/projects/tabs/ProjectOverview';
import ProjectTasks from '../components/projects/tabs/ProjectTasks';
// import ProjectMilestones from '../components/projects/tabs/ProjectMilestones';
// import ProjectFiles from '../components/projects/tabs/ProjectFiles';
// import ProjectFinance from '../components/projects/tabs/ProjectFinance';
// import ProjectSettings from '../components/projects/tabs/ProjectSettings';

import TaskDrawer from '../components/tasks/TaskDrawer';
import CreateProjectModal from '../components/projects/CreateProjectModal';

const ProjectDetail = () => {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('overview');
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        setLoading(true);
        const docRef = doc(db, 'projects', id);

        // Use onSnapshot for real-time updates
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setProject({ id: docSnap.id, ...docSnap.data() });
            } else {
                console.log("No such project!");
                setProject(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching project:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id]);

    if (loading) {
        return (
            <ThreePaneLayout>
                <div className="flex items-center justify-center h-full">
                    <Icon name="Loader2" className="animate-spin text-primary" size={32} />
                </div>
            </ThreePaneLayout>
        );
    }

    if (!project) {
        return (
            <ThreePaneLayout>
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <p className="text-text-secondary">Project not found.</p>
                    <Link to="/app/projects">
                        <Button variant="secondary">Back to Projects</Button>
                    </Link>
                </div>
            </ThreePaneLayout>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
        { id: 'tasks', label: 'Tasks', icon: 'CheckSquare' },
        { id: 'milestones', label: 'Milestones', icon: 'Flag' },
        { id: 'files', label: 'Files', icon: 'FileText' },
        { id: 'finance', label: 'Finance', icon: 'DollarSign' },
        { id: 'settings', label: 'Settings', icon: 'Settings' },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview': return <ProjectOverview project={project} />;
            case 'tasks': return <ProjectTasks projectId={project.id} />;
            case 'milestones': return <div className="p-4">Milestones View (Coming Soon)</div>; // <ProjectMilestones projectId={project.id} />;
            case 'files': return <div className="p-4">Files View (Coming Soon)</div>; // <ProjectFiles projectId={project.id} />;
            case 'finance': return <div className="p-4">Finance View (Coming Soon)</div>; // <ProjectFinance projectId={project.id} />;
            case 'settings': return <div className="p-4">Settings View (Coming Soon)</div>; // <ProjectSettings projectId={project.id} />;
            default: return <ProjectOverview project={project} />;
        }
    };

    return (
        <ThreePaneLayout
            leftPanel={
                <div className="p-4 space-y-6">
                    <div>
                        <h3 className="font-semibold text-text-primary mb-2">Project Nav</h3>
                        <div className="space-y-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                                        }`}
                                >
                                    <Icon name={tab.icon} size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            }
            rightPanel={
                <div className="p-4">
                    <h3 className="font-semibold text-text-primary mb-4">Activity Feed</h3>
                    <div className="text-sm text-text-secondary">No recent activity.</div>
                </div>
            }
        >
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="px-6 py-6 border-b border-border bg-surface">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <Link to="/app/projects" className="text-muted hover:text-text-primary">
                                <Icon name="ArrowLeft" size={20} />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-text-primary">{project.name}</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="primary">{project.status}</Badge>
                                    <span className="text-text-secondary text-sm">• {project.type}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="secondary" size="sm" onClick={() => setIsEditModalOpen(true)}>Edit Project</Button>
                            <Button size="sm" onClick={() => setIsTaskDrawerOpen(true)}>
                                <Icon name="Plus" size={16} className="mr-2" /> Add Task
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-background">
                    {renderTabContent()}
                </div>

                <TaskDrawer
                    isOpen={isTaskDrawerOpen}
                    onClose={() => setIsTaskDrawerOpen(false)}
                    projectId={project.id}
                    onSave={() => {
                        // No need to manually refresh, onSnapshot handles it
                        setIsTaskDrawerOpen(false);
                    }}
                />

                <CreateProjectModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    project={project}
                    onSuccess={() => console.log('Project updated')}
                />
            </div>
        </ThreePaneLayout>
    );
};

export default ProjectDetail;
