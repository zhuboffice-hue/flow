import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import KanbanBoard from '../../ui/KanbanBoard';
import Table from '../../ui/Table';
import Button from '../../ui/Button';
import Icon from '../../ui/Icon';
import TaskDrawer from '../../tasks/TaskDrawer';
import Badge from '../../ui/Badge';
import Select from '../../ui/Select';

const ProjectTasks = ({ projectId }) => {
    const [view, setView] = useState('board'); // 'board' | 'list' | 'table'
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [initialStatus, setInitialStatus] = useState(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState('All');
    const [priorityFilter, setPriorityFilter] = useState('All');

    useEffect(() => {
        if (!projectId) return;

        const q = query(collection(db, 'projects', projectId, 'tasks'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTasks(tasksData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [projectId]);

    useEffect(() => {
        let result = tasks;
        if (statusFilter !== 'All') {
            result = result.filter(t => t.status === statusFilter);
        }
        if (priorityFilter !== 'All') {
            result = result.filter(t => t.priority === priorityFilter);
        }
        setFilteredTasks(result);
    }, [tasks, statusFilter, priorityFilter]);

    const handleCreateTask = () => {
        setSelectedTask(null);
        setInitialStatus(null);
        setIsDrawerOpen(true);
    };

    const handleEditTask = (task) => {
        setSelectedTask(task);
        setIsDrawerOpen(true);
    };

    const handleColumnAdd = (status) => {
        setSelectedTask(null);
        setInitialStatus(status);
        setIsDrawerOpen(true);
    };

    const handleColumnMenu = async (status) => {
        if (!window.confirm(`Are you sure you want to DELETE ALL tasks in the "${status}" column? This cannot be undone.`)) return;

        try {
            const tasksToDelete = tasks.filter(t => t.status === status);
            const deletePromises = tasksToDelete.map(t =>
                deleteDoc(doc(db, 'projects', projectId, 'tasks', t.id))
            );
            await Promise.all(deletePromises);
            // alert(`Cleared ${tasksToDelete.length} tasks from ${status}.`); // Optional
        } catch (error) {
            console.error("Error clearing column:", error);
            alert("Failed to clear column.");
        }
    };

    const kanbanColumns = [
        { id: 'To Do', title: 'To Do' },
        { id: 'In Progress', title: 'In Progress' },
        { id: 'Review', title: 'Review' },
        { id: 'Done', title: 'Done' },
    ];

    const listColumns = [
        { key: 'select', header: '', cell: () => <input type="checkbox" className="rounded border-gray-300" /> },
        { key: 'title', header: 'Task Name', accessor: 'title', cell: (row) => <span className="font-medium text-text-primary cursor-pointer hover:underline" onClick={() => handleEditTask(row)}>{row.title}</span> },
        {
            key: 'assignee',
            header: 'Assignee',
            accessor: 'assigneeId',
            cell: (row) => row.assigneeId ? <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">A</div> : <span className="text-muted">-</span>
        },
        {
            key: 'priority',
            header: 'Priority',
            accessor: 'priority',
            cell: (row) => {
                const colors = { 'High': 'text-danger', 'Urgent': 'text-danger font-bold', 'Critical': 'text-danger font-bold', 'Medium': 'text-warning', 'Low': 'text-success' };
                return <span className={colors[row.priority] || 'text-text-secondary'}>{row.priority}</span>;
            }
        },
        {
            key: 'status',
            header: 'Status',
            accessor: 'status',
            cell: (row) => {
                const variants = { 'In Progress': 'primary', 'To Do': 'default', 'Done': 'success', 'Review': 'warning' };
                return <Badge variant={variants[row.status] || 'default'}>{row.status}</Badge>;
            }
        },
        { key: 'dueDate', header: 'Due Date', accessor: 'dueDate', cell: (row) => row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '-' },
        { key: 'time', header: 'Time', cell: (row) => row.actualHours > 0 ? `${row.actualHours.toFixed(1)}h` : '-' },
        { key: 'actions', header: '', cell: () => <Button variant="ghost" size="icon"><Icon name="MoreHorizontal" size={16} /></Button> }
    ];

    const tableColumns = [
        { key: 'title', header: 'Title', accessor: 'title', cell: (row) => <span className="font-medium text-text-primary cursor-pointer hover:underline" onClick={() => handleEditTask(row)}>{row.title}</span> },
        { key: 'assignee', header: 'Assignee', accessor: 'assigneeId', cell: (row) => row.assigneeId ? 'Assigned' : '-' },
        { key: 'status', header: 'Status', accessor: 'status' },
        { key: 'priority', header: 'Priority', accessor: 'priority' },
        { key: 'estimate', header: 'Est. (h)', accessor: 'estimateHours' },
        { key: 'actual', header: 'Act. (h)', accessor: 'actualHours' },
        { key: 'startDate', header: 'Start', accessor: 'startDate', cell: (row) => row.startDate ? new Date(row.startDate).toLocaleDateString() : '-' },
        { key: 'dueDate', header: 'Due', accessor: 'dueDate', cell: (row) => row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '-' },
        { key: 'tags', header: 'Tags', cell: (row) => row.tags?.join(', ') || '-' },
        { key: 'actions', header: '', cell: () => <Button variant="ghost" size="icon"><Icon name="MoreHorizontal" size={16} /></Button> }
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Header Actions & Filters */}
            <div className="px-6 py-4 border-b border-border bg-background space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-text-primary">Tasks</h2>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm">Bulk Actions</Button>
                        <Button size="sm" onClick={handleCreateTask}>
                            <Icon name="Plus" size={14} className="mr-2" /> New Task
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1 max-w-xs">
                            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                className="w-full pl-9 pr-3 py-1.5 text-sm bg-surface border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <select
                            className="bg-surface border border-border rounded-md text-sm px-3 py-1.5 focus:outline-none"
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
                            className="bg-surface border border-border rounded-md text-sm px-3 py-1.5 focus:outline-none"
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

                    <div className="flex bg-surface rounded-md border border-border p-1">
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
            <div className="flex-1 overflow-hidden p-6 bg-gray-50/50">
                {loading ? (
                    <div className="flex justify-center items-center h-full">Loading tasks...</div>
                ) : filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-text-secondary">
                        <Icon name="CheckSquare" size={48} className="mb-4 text-muted" />
                        <p>No tasks found matching your filters.</p>
                        <Button variant="link" onClick={handleCreateTask}>Create Task</Button>
                    </div>
                ) : (
                    <>
                        {view === 'kanban' && <KanbanBoard
                            columns={kanbanColumns}
                            tasks={filteredTasks}
                            onCardClick={handleEditTask}
                            onAddClick={handleColumnAdd}
                            onMenuClick={handleColumnMenu}
                        />}
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
                projectId={projectId}
                task={selectedTask}
                initialStatus={initialStatus}
                onSave={() => {
                    // Real-time listener handles updates
                }}
            />
        </div>
    );
};

export default ProjectTasks;
