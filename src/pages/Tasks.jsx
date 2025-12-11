import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, getDocs, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ThreePaneLayout from '../components/layout/ThreePaneLayout';
import KanbanBoard from '../components/ui/KanbanBoard';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import TaskDrawer from '../components/tasks/TaskDrawer';
import Badge from '../components/ui/Badge';
import Select from '../components/ui/Select';

import { useAuth } from '../context/AuthContext';

const Tasks = () => {
    const { currentUser } = useAuth();
    const [view, setView] = useState('kanban'); // 'kanban' | 'list' | 'table'
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState({});
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [initialStatus, setInitialStatus] = useState(null);
    const [debugInfo, setDebugInfo] = useState([]);

    // Filters
    const [statusFilter, setStatusFilter] = useState('All');
    const [priorityFilter, setPriorityFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch Projects and Tasks
    useEffect(() => {
        if (!currentUser?.companyId) return;

        const fetchAllData = async () => {
            setLoading(true);
            const logs = [];
            const addLog = (msg) => logs.push(msg);

            try {
                // 1. Fetch Projects (Only for this company)
                // Filter by companyId
                const projectsQ = query(collection(db, 'projects'), where('companyId', '==', currentUser.companyId));
                const projectsSnapshot = await getDocs(projectsQ);
                addLog(`Projects fetched: ${projectsSnapshot.size}`);
                const projectsMap = {};
                projectsSnapshot.docs.forEach(doc => {
                    projectsMap[doc.id] = doc.data();
                });
                setProjects(projectsMap);

                // 2. Fetch Tasks for each project
                const allTasks = [];
                const projectIds = Object.keys(projectsMap);
                addLog(`Project IDs: ${projectIds.join(', ')}`);

                await Promise.all(projectIds.map(async (pid) => {
                    try {
                        const tasksRef = collection(db, 'projects', pid, 'tasks');
                        // Try without ordering first to rule out index issues
                        // const q = query(tasksRef, orderBy('createdAt', 'desc')); 
                        const snapshot = await getDocs(tasksRef);
                        addLog(`Project ${pid} (${projectsMap[pid].name}) tasks: ${snapshot.size}`);
                        snapshot.docs.forEach(doc => {
                            allTasks.push({
                                id: doc.id,
                                projectId: pid,
                                projectName: projectsMap[pid].name,
                                ...doc.data()
                            });
                        });
                    } catch (err) {
                        console.error(`Error fetching tasks for project ${pid}:`, err);
                        addLog(`Error fetching tasks for project ${pid}: ${err.message}`);
                    }
                }));

                addLog(`Total tasks fetched: ${allTasks.length}`);
                // Sort manually since we removed the query sort
                allTasks.sort((a, b) => {
                    const dateA = a.createdAt?.seconds || 0;
                    const dateB = b.createdAt?.seconds || 0;
                    return dateB - dateA;
                });

                setTasks(allTasks);
            } catch (error) {
                console.error("Error fetching global tasks:", error);
                addLog(`Error fetching global tasks: ${error.message}`);
            } finally {
                setLoading(false);
                setDebugInfo(logs);
            }
        };

        fetchAllData();
    }, [currentUser]);

    // Filtering Logic
    useEffect(() => {
        let result = tasks;

        if (statusFilter !== 'All') {
            result = result.filter(t => t.status === statusFilter);
        }
        if (priorityFilter !== 'All') {
            result = result.filter(t => t.priority === priorityFilter);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.projectName?.toLowerCase().includes(query)
            );
        }

        setFilteredTasks(result);
    }, [tasks, statusFilter, priorityFilter, searchQuery]);

    const handleEditTask = (task) => {
        setSelectedTask(task);
        setSelectedProjectId(task.projectId);
        setIsDrawerOpen(true);
    };

    const handleColumnAdd = (status) => {
        setSelectedTask(null);
        setSelectedProjectId(null); // Clear project selection for new task
        setInitialStatus(status);
        setIsDrawerOpen(true);
    };

    const handleColumnMenu = async (status) => {
        if (!window.confirm(`Are you sure you want to DELETE ALL tasks in the "${status}" column? This cannot be undone.`)) return;

        try {
            const tasksToDelete = tasks.filter(t => t.status === status);
            const deletePromises = tasksToDelete.map(t =>
                deleteDoc(doc(db, 'projects', t.projectId, 'tasks', t.id))
            );
            await Promise.all(deletePromises);
            // Refresh logic - handled by handleTaskSaved but maybe valid here too if we want manual reload
            // optimized: remove locally
            setTasks(prev => prev.filter(t => t.status !== status));
            alert(`Cleared ${tasksToDelete.length} tasks from ${status}.`);
        } catch (error) {
            console.error("Error clearing column:", error);
            alert("Failed to clear column.");
        }
    };

    const handleTaskSaved = () => {
        // Refresh data - simple reload for now
        window.location.reload();
    };

    const handleStatusChange = async (taskId, newStatus) => {
        // 1. Optimistic Update
        const updatedTasks = tasks.map(t =>
            t.id === taskId ? { ...t, status: newStatus } : t
        );
        setTasks(updatedTasks);

        // 2. Find the task to get its projectId
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        // 3. Update Firestore
        try {
            const taskRef = doc(db, 'projects', task.projectId, 'tasks', taskId);
            await updateDoc(taskRef, { status: newStatus });
        } catch (error) {
            console.error("Error updating task status:", error);
            // Revert on error (optional, but good practice)
            // fetchAllData(); // Or revert local state
        }
    };

    const kanbanColumns = [
        { id: 'To Do', title: 'To Do' },
        { id: 'In Progress', title: 'In Progress' },
        { id: 'Review', title: 'Review' },
        { id: 'Done', title: 'Done' },
    ];

    const listColumns = [
        // Removed checkbox until bulk actions are implemented
        { key: 'title', header: 'Task Name', accessor: 'title', cell: (_, row) => <span className="font-medium text-text-primary cursor-pointer hover:underline" onClick={() => handleEditTask(row)}>{row.title}</span> },
        { key: 'project', header: 'Project', accessor: 'projectName', cell: (_, row) => <span className="text-xs text-text-secondary bg-gray-100 px-2 py-1 rounded">{row.projectName}</span> },
        {
            key: 'assignee',
            header: 'Assignee',
            accessor: 'assigneeId',
            cell: (_, row) => row.assigneeId ? <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs" title={row.assigneeName}>{row.assigneeName?.charAt(0) || 'A'}</div> : <span className="text-muted">-</span>
        },
        {
            key: 'priority',
            header: 'Priority',
            accessor: 'priority',
            cell: (_, row) => {
                const colors = { 'High': 'text-danger', 'Urgent': 'text-danger font-bold', 'Critical': 'text-danger font-bold', 'Medium': 'text-warning', 'Low': 'text-success' };
                return <span className={colors[row.priority] || 'text-text-secondary'}>{row.priority}</span>;
            }
        },
        {
            key: 'status',
            header: 'Status',
            accessor: 'status',
            cell: (_, row) => {
                const variants = { 'In Progress': 'primary', 'To Do': 'default', 'Done': 'success', 'Review': 'warning' };
                return <Badge variant={variants[row.status] || 'default'}>{row.status}</Badge>;
            }
        },
        { key: 'dueDate', header: 'Due Date', accessor: 'dueDate', cell: (_, row) => row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '-' },
        {
            key: 'actions',
            header: 'Actions',
            cell: (_, row) => (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditTask(row)} title="Edit">
                        <Icon name="Pencil" size={14} className="text-text-secondary hover:text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                        if (window.confirm('Are you sure you want to delete this task?')) {
                            deleteDoc(doc(db, 'projects', row.projectId, 'tasks', row.id)).then(() => {
                                setTasks(prev => prev.filter(t => t.id !== row.id));
                            });
                        }
                    }} title="Delete">
                        <Icon name="Trash2" size={14} className="text-text-secondary hover:text-danger" />
                    </Button>
                </div>
            )
        }
    ];

    const tableColumns = [
        { key: 'title', header: 'Title', accessor: 'title', cell: (_, row) => <span className="font-medium text-text-primary cursor-pointer hover:underline" onClick={() => handleEditTask(row)}>{row.title}</span> },
        { key: 'project', header: 'Project', accessor: 'projectName', cell: (_, row) => <span className="text-xs text-text-secondary bg-gray-100 px-2 py-1 rounded">{row.projectName}</span> },
        { key: 'assignee', header: 'Assignee', accessor: 'assigneeId', cell: (_, row) => row.assigneeId ? row.assigneeName : '-' },
        { key: 'status', header: 'Status', accessor: 'status' },
        { key: 'priority', header: 'Priority', accessor: 'priority' },
        // Removed Estimate and Actual hours as requested
        { key: 'dueDate', header: 'Due', accessor: 'dueDate', cell: (_, row) => row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '-' },
        {
            key: 'actions',
            header: 'Actions',
            cell: (_, row) => (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditTask(row)} title="Edit">
                        <Icon name="Pencil" size={14} className="text-text-secondary hover:text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                        if (window.confirm('Are you sure you want to delete this task?')) {
                            deleteDoc(doc(db, 'projects', row.projectId, 'tasks', row.id)).then(() => {
                                setTasks(prev => prev.filter(t => t.id !== row.id));
                            });
                        }
                    }} title="Delete">
                        <Icon name="Trash2" size={14} className="text-text-secondary hover:text-danger" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <ThreePaneLayout>
            <div className="flex flex-col h-full">
                {/* Header Actions & Filters */}
                <div className="mb-6 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h2 className="text-h3 font-bold text-text-primary">Global Tasks</h2>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm">Bulk Actions</Button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 flex-1">
                            <div className="relative flex-1 md:max-w-xs">
                                <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-1.5 text-sm bg-surface border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 md:flex-none bg-surface border border-border rounded-md text-sm px-3 py-1.5 focus:outline-none"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="All">All Status</option>
                                    <option value="To Do">To Do</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Review">Review</option>
                                    <option value="Done">Done</option>
                                </select>
                                <select
                                    className="flex-1 md:flex-none bg-surface border border-border rounded-md text-sm px-3 py-1.5 focus:outline-none"
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                >
                                    <option value="All">All Priority</option>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex bg-surface rounded-md border border-border p-1 self-start md:self-auto">
                            <button
                                onClick={() => setView('kanban')}
                                className={`p-1.5 rounded ${view === 'kanban' ? 'bg-gray-100 text-text-primary' : 'text-muted hover:text-text-primary'}`}
                                title="Kanban View"
                            >
                                <Icon name="KanbanSquare" size={16} />
                            </button>
                            <button
                                onClick={() => setView('list')}
                                className={`p-1.5 rounded ${view === 'list' ? 'bg-gray-100 text-text-primary' : 'text-muted hover:text-text-primary'}`}
                                title="List View"
                            >
                                <Icon name="List" size={16} />
                            </button>
                            <button
                                onClick={() => setView('table')}
                                className={`p-1.5 rounded ${view === 'table' ? 'bg-gray-100 text-text-primary' : 'text-muted hover:text-text-primary'}`}
                                title="Table View"
                            >
                                <Icon name="Table" size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden bg-gray-50/50 -mx-6 -mb-6 p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">Loading tasks...</div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-text-secondary">
                            <Icon name="CheckSquare" size={48} className="mb-4 text-muted" />
                            <p>No tasks found matching your filters.</p>

                            {/* Debug Info */}
                            <div className="mt-8 p-4 bg-gray-100 rounded text-xs text-left font-mono whitespace-pre-wrap max-w-lg border border-gray-300">
                                <p className="font-bold mb-2">Debug Info:</p>
                                {debugInfo.map((log, i) => <div key={i}>{log}</div>)}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* ... existing views ... */}
                            {view === 'kanban' && (
                                <KanbanBoard
                                    columns={kanbanColumns}
                                    tasks={filteredTasks}
                                    onCardClick={handleEditTask}
                                    onStatusChange={handleStatusChange}
                                    onAddClick={handleColumnAdd}
                                    onMenuClick={handleColumnMenu}
                                />
                            )}
                            {view === 'list' && (
                                <div className="bg-surface rounded-lg border border-border overflow-hidden">
                                    <Table columns={listColumns} data={filteredTasks} />
                                </div>
                            )}
                            {view === 'table' && (
                                <div className="bg-surface rounded-lg border border-border overflow-hidden">
                                    <Table columns={tableColumns} data={filteredTasks} />
                                </div>
                            )}
                        </>
                    )}
                </div>

                <TaskDrawer
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    projectId={selectedProjectId}
                    task={selectedTask}
                    initialStatus={initialStatus}
                    onSave={handleTaskSaved}
                />
            </div>
        </ThreePaneLayout>
    );
};

export default Tasks;
