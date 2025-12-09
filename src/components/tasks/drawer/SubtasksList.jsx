import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { initialSubtaskState } from '../../../lib/models';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Icon from '../../ui/Icon';
import Avatar from '../../ui/Avatar';

const SubtasksList = ({ taskId, projectId }) => {
    const [subtasks, setSubtasks] = useState([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (!taskId || !projectId) return;

        const q = query(collection(db, 'projects', projectId, 'tasks', taskId, 'subtasks'), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setSubtasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [taskId, projectId]);

    const handleAddSubtask = async (e) => {
        e.preventDefault();
        if (!newSubtaskTitle.trim()) return;
        if (!taskId || !projectId) {
            console.error("Cannot add subtask: Missing taskId or projectId");
            return;
        }

        try {
            await addDoc(collection(db, 'projects', projectId, 'tasks', taskId, 'subtasks'), {
                ...initialSubtaskState,
                taskId,
                title: newSubtaskTitle,
                createdAt: new Date()
            });
            setNewSubtaskTitle('');
            setIsAdding(false);
        } catch (error) {
            console.error("Error adding subtask:", error);
        }
    };

    const toggleSubtask = async (subtask) => {
        try {
            await updateDoc(doc(db, 'projects', projectId, 'tasks', taskId, 'subtasks', subtask.id), {
                status: subtask.status === 'done' ? 'pending' : 'done'
            });
        } catch (error) {
            console.error("Error updating subtask:", error);
        }
    };

    const deleteSubtask = async (subtaskId) => {
        try {
            await deleteDoc(doc(db, 'projects', projectId, 'tasks', taskId, 'subtasks', subtaskId));
        } catch (error) {
            console.error("Error deleting subtask:", error);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-medium text-text-primary">Subtasks</h3>
                <span className="text-xs text-text-secondary">
                    {subtasks.filter(s => s.status === 'done').length}/{subtasks.length} completed
                </span>
            </div>

            <div className="space-y-2">
                {subtasks.map(subtask => (
                    <div key={subtask.id} className="group flex items-center gap-3 p-2 rounded-md hover:bg-surface-secondary border border-transparent hover:border-border transition-colors">
                        <button
                            onClick={() => toggleSubtask(subtask)}
                            className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${subtask.status === 'done'
                                ? 'bg-primary border-primary text-white'
                                : 'border-muted hover:border-primary'
                                }`}
                        >
                            {subtask.status === 'done' && <Icon name="Check" size={12} />}
                        </button>

                        <span className={`flex-1 text-sm ${subtask.status === 'done' ? 'text-muted line-through' : 'text-text-primary'}`}>
                            {subtask.title}
                        </span>

                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity">
                            <Avatar size="xs" fallback="?" /> {/* Placeholder for assignee */}
                            <button onClick={() => deleteSubtask(subtask.id)} className="text-muted hover:text-danger">
                                <Icon name="Trash2" size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isAdding ? (
                <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
                    <Input
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        placeholder="What needs to be done?"
                        className="flex-1"
                        autoFocus
                    />
                    <Button type="submit" size="sm">Add</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
                </form>
            ) : (
                <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)} className="text-muted hover:text-primary">
                    <Icon name="Plus" size={14} className="mr-2" /> Add Subtask
                </Button>
            )}
        </div>
    );
};

export default SubtasksList;
