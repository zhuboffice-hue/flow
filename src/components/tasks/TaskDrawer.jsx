import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, getDocs, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { initialTaskState } from '../../lib/models';
import Drawer from '../ui/Drawer';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Icon from '../ui/Icon';
import SubtasksList from './drawer/SubtasksList';
import CommentFeed from './drawer/CommentFeed';
import TimeTracker from './drawer/TimeTracker';
import ApprovalManager from './drawer/ApprovalManager';
import FileList from './drawer/FileList';

const TaskDrawer = ({ isOpen, onClose, projectId, task, initialStatus, onSave }) => {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState(initialTaskState);
    const [activeTab, setActiveTab] = useState('details');
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [projectName, setProjectName] = useState('');

    const isNewTask = !task?.id;

    useEffect(() => {
        if (task) {
            setFormData(task);
        } else {
            setFormData({
                ...initialTaskState,
                projectId,
                status: initialStatus || 'To Do'
            });
        }
    }, [task, projectId, isOpen, initialStatus]);

    // Fetch employees and project name
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Employees
                const querySnapshot = await getDocs(collection(db, 'employees'));
                const employeeList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name,
                    email: doc.data().email,
                    role: doc.data().role
                }));
                setEmployees(employeeList);

                // Fetch Project Name if projectId is available
                if (projectId) {
                    const projectDoc = await getDoc(doc(db, 'projects', projectId));
                    if (projectDoc.exists()) {
                        setProjectName(projectDoc.data().name);
                    }
                } else {
                    // Fetch all projects for selection if no projectId passed (Quick Add mode)
                    const projectsSnap = await getDocs(collection(db, 'projects'));
                    const projectList = projectsSnap.docs.map(d => ({ id: d.id, name: d.data().name }));
                    setProjects(projectList);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        if (isOpen) {
            fetchData();
        }
    }, [isOpen, projectId]);

    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');

    useEffect(() => {
        setSelectedProjectId(projectId || '');
    }, [projectId, isOpen]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAssigneeChange = (e) => {
        const assigneeId = e.target.value;
        const assignee = employees.find(emp => emp.id === assigneeId);
        setFormData(prev => ({
            ...prev,
            assigneeId: assigneeId,
            assigneeName: assignee ? assignee.name : ''
        }));
    };

    const handleSave = async () => {
        const finalProjectId = projectId || selectedProjectId;
        if (!finalProjectId) {
            alert("Please select a project");
            return;
        }

        setLoading(true);
        try {
            let savedTaskId = task?.id;

            if (task?.id) {
                await updateDoc(doc(db, 'projects', finalProjectId, 'tasks', task.id), {
                    ...formData,
                    updatedAt: new Date()
                });
            } else {
                const docRef = await addDoc(collection(db, 'projects', finalProjectId, 'tasks'), {
                    ...formData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                savedTaskId = docRef.id;
            }

            // Handle Assignment Logic
            const isNewAssignment = formData.assigneeId && (!task || task.assigneeId !== formData.assigneeId);

            if (isNewAssignment) {
                const assignee = employees.find(e => e.id === formData.assigneeId);

                // 1. Add assignee to Project Team
                if (finalProjectId && formData.assigneeId) {
                    await updateDoc(doc(db, 'projects', finalProjectId), {
                        team: arrayUnion(formData.assigneeId)
                    });
                }

                // 2. Send Notification
                if (assignee && currentUser) {
                    await addDoc(collection(db, 'notifications'), {
                        recipientId: assignee.id,
                        recipientEmail: assignee.email,
                        senderName: currentUser.displayName || currentUser.email || 'System',
                        content: `You have been assigned to task: "${formData.title}" in project "${projectName || projects.find(p => p.id === finalProjectId)?.name || 'Unknown Project'}"`,
                        isRead: false,
                        createdAt: new Date(),
                        type: 'assignment',
                        link: '/app/tasks'
                    });
                }
            }

            if (onSave) onSave();
            onClose();
        } catch (error) {
            console.error("Error saving task:", error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'details', label: 'Details' },
        { id: 'subtasks', label: 'Subtasks' },
        { id: 'comments', label: 'Comments' },
        { id: 'files', label: 'Files' },
        { id: 'time', label: 'Time' },
        { id: 'approvals', label: 'Approvals' },
    ];

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={task ? 'Edit Task' : 'New Task'}
            size="lg"
            bodyClassName="p-0 flex flex-col overflow-hidden"
        >
            <div className="flex flex-col h-full">
                {/* Tabs */}
                <div className="flex border-b border-border px-6 overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => !isNewTask && setActiveTab(tab.id)}
                            disabled={isNewTask && tab.id !== 'details'}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-text-secondary hover:text-text-primary'
                                } ${isNewTask && tab.id !== 'details' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={isNewTask && tab.id !== 'details' ? "Save task first to access this tab" : ""}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'details' && (
                        <div className="space-y-4">
                            {!projectId && (
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Project</label>
                                    <select
                                        className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary transition-colors text-sm"
                                        value={selectedProjectId}
                                        onChange={(e) => setSelectedProjectId(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Project</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <Input
                                label="Task Title"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                required
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Select
                                    label="Status"
                                    value={formData.status}
                                    onChange={(e) => handleChange('status', e.target.value)}
                                    options={[
                                        { value: 'To Do', label: 'To Do' },
                                        { value: 'In Progress', label: 'In Progress' },
                                        { value: 'Review', label: 'Review' },
                                        { value: 'Done', label: 'Done' }
                                    ]}
                                />
                                <Select
                                    label="Priority"
                                    value={formData.priority}
                                    onChange={(e) => handleChange('priority', e.target.value)}
                                    options={[
                                        { value: 'Low', label: 'Low' },
                                        { value: 'Medium', label: 'Medium' },
                                        { value: 'High', label: 'High' },
                                        { value: 'Urgent', label: 'Urgent' },
                                        { value: 'Critical', label: 'Critical' }
                                    ]}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Assignee</label>
                                    <select
                                        className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary transition-colors text-sm"
                                        value={formData.assigneeId || ''}
                                        onChange={handleAssigneeChange}
                                    >
                                        <option value="">Unassigned</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Input
                                    label="Due Date"
                                    type="date"
                                    value={formData.dueDate || ''}
                                    onChange={(e) => handleChange('dueDate', e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Start Date"
                                    type="date"
                                    value={formData.startDate || ''}
                                    onChange={(e) => handleChange('startDate', e.target.value)}
                                />
                                <Input
                                    label="Estimate (Hours)"
                                    type="number"
                                    value={formData.estimateHours}
                                    onChange={(e) => handleChange('estimateHours', parseFloat(e.target.value) || 0)}
                                />
                            </div>

                            <TextArea
                                label="Description"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                rows={6}
                            />
                        </div>
                    )}

                    {activeTab === 'subtasks' && (
                        <SubtasksList taskId={task?.id} projectId={projectId} />
                    )}

                    {activeTab === 'comments' && (
                        <CommentFeed taskId={task?.id} projectId={projectId} />
                    )}

                    {activeTab === 'time' && (
                        <TimeTracker taskId={task?.id} projectId={projectId} />
                    )}

                    {activeTab === 'approvals' && (
                        <ApprovalManager
                            taskId={task?.id}
                            projectId={projectId}
                            employees={employees}
                            taskTitle={formData.title}
                        />
                    )}

                    {activeTab === 'files' && (
                        <FileList taskId={task?.id} projectId={projectId} />
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-surface flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Task'}
                    </Button>
                </div>
            </div>
        </Drawer>
    );
};

export default TaskDrawer;
