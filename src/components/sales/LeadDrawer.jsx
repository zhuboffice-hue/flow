import React, { useState, useEffect } from 'react';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { doc, updateDoc, addDoc, collection, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../hooks/useCurrency';

const LeadDrawer = ({ lead, onClose, employees = [] }) => {
    const { currentUser } = useAuth();
    const { formatCurrency } = useCurrency();
    const fileInputRef = React.useRef(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [assigneeId, setAssigneeId] = useState(lead?.assigneeId || '');

    // ... (rest of state)

    // ... (rest of effects and handlers)

    if (!lead) return null;

    // Parse value
    const val = parseFloat((lead.value || '0').replace(/[^0-9.-]+/g, ""));
    const rawAmount = isNaN(val) ? 0 : val;

    return (
        <div className="fixed inset-y-0 right-0 w-[600px] bg-surface shadow-2xl border-l border-border z-40 flex flex-col transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="p-6 border-b border-border">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-text-primary">{lead.company}</h2>
                        <p className="text-text-secondary">{lead.name}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <Icon name="X" size={20} />
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Badge variant="primary">{lead.status || 'New Lead'}</Badge>
                    <span className="text-sm font-bold text-text-primary">
                        {formatCurrency(rawAmount, lead.currency || 'USD')}
                    </span>
                    <div className="flex items-center gap-1 text-sm text-text-secondary">
                        <Icon name="User" size={14} />
                        <select
                            value={assigneeId}
                            onChange={handleAssigneeChange}
                            className="bg-transparent border-none focus:ring-0 text-sm text-text-secondary cursor-pointer hover:text-text-primary"
                        >
                            <option value="">Unassigned</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-border">
                <div className="flex gap-6">
                    {['overview', 'communication', 'tasks', 'files', 'activity'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-3 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab
                                ? 'border-primary text-primary'
                                : 'border-transparent text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-surface-secondary/30">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="bg-surface p-4 rounded-lg border border-border">
                            <h3 className="font-bold text-text-primary mb-4">Contact Information</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Email</span>
                                    <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email || 'N/A'}</a>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Phone</span>
                                    <span className="text-text-primary">{lead.phone || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Source</span>
                                    <span className="text-text-primary">{lead.source || 'Website'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-surface p-4 rounded-lg border border-border">
                            <h3 className="font-bold text-text-primary mb-4">Notes</h3>
                            <textarea
                                className="w-full h-32 bg-background border border-border rounded-md p-3 text-sm focus:outline-none focus:border-primary text-text-primary resize-none"
                                placeholder="Add a note..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            ></textarea>
                            <div className="flex justify-end mt-2">
                                <Button size="sm" onClick={handleSaveNote}>Save Note</Button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'communication' && (
                    <div className="space-y-4">
                        <div className="bg-surface p-4 rounded-lg border border-border">
                            <h3 className="font-bold text-text-primary mb-4">Log Communication</h3>
                            <div className="flex gap-2 mb-3">
                                {['Call', 'Email', 'Meeting'].map(type => (
                                    <Button
                                        key={type}
                                        variant={commType === type ? 'primary' : 'outline'}
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => setCommType(type)}
                                    >
                                        <Icon name={type === 'Call' ? 'Phone' : type === 'Email' ? 'Mail' : 'MessageSquare'} size={14} className="mr-2" /> {type}
                                    </Button>
                                ))}
                            </div>
                            <textarea
                                className="w-full h-24 bg-background border border-border rounded-md p-3 text-sm focus:outline-none focus:border-primary text-text-primary resize-none mb-2"
                                placeholder="Details about the interaction..."
                                value={commNote}
                                onChange={(e) => setCommNote(e.target.value)}
                            ></textarea>
                            <div className="flex justify-end">
                                <Button size="sm" onClick={handleLogActivity}>Log Activity</Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-bold text-text-primary text-sm">History</h3>
                            {activities.filter(a => ['Call', 'Email', 'Meeting'].includes(a.type)).map(activity => (
                                <div key={activity.id} className="bg-surface p-3 rounded border border-border">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded ${activity.type === 'Call' ? 'bg-blue-100 text-blue-600' :
                                                activity.type === 'Email' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
                                                }`}>
                                                <Icon name={activity.type === 'Call' ? 'Phone' : activity.type === 'Email' ? 'Mail' : 'MessageSquare'} size={12} />
                                            </div>
                                            <span className="font-medium text-sm text-text-primary">{activity.type}</span>
                                        </div>
                                        <span className="text-xs text-text-secondary">
                                            {activity.createdAt?.seconds ? new Date(activity.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-text-secondary ml-8">{activity.content}</p>
                                </div>
                            ))}
                            {activities.filter(a => ['Call', 'Email', 'Meeting'].includes(a.type)).length === 0 && (
                                <p className="text-sm text-text-secondary text-center py-4">No communication history yet.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-text-primary">Tasks</h3>
                        </div>

                        {/* Add Task Form */}
                        <div className="bg-surface p-3 rounded border border-border space-y-2">
                            <input
                                type="text"
                                placeholder="New task..."
                                className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    className="bg-background border border-border rounded px-3 py-2 text-sm"
                                    value={newTaskDate}
                                    onChange={(e) => setNewTaskDate(e.target.value)}
                                />
                                <Button size="sm" onClick={handleAddTask} disabled={!newTask.trim()}>Add</Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {tasks.map(task => (
                                <div key={task.id} className="bg-surface p-3 rounded border border-border flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={task.completed}
                                        onChange={() => toggleTask(task.id, task.completed)}
                                    />
                                    <div className={task.completed ? 'opacity-50 line-through' : ''}>
                                        <p className="text-sm font-medium text-text-primary">{task.title}</p>
                                        {task.dueDate && (
                                            <p className="text-xs text-text-secondary">
                                                Due {new Date(task.dueDate.seconds * 1000).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {tasks.length === 0 && (
                                <p className="text-sm text-text-secondary text-center py-4">No tasks yet.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'files' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-text-primary">Files</h3>
                            <div className="relative">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                                <Button
                                    size="sm"
                                    disabled={uploading}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {uploading ? 'Uploading...' : 'Upload File'}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {files.map(file => (
                                <div key={file.id} className="bg-surface p-3 rounded border border-border flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-surface-secondary rounded">
                                            <Icon name="File" size={20} className="text-text-secondary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-text-primary">{file.name}</p>
                                            <p className="text-xs text-text-secondary">
                                                {(file.size / 1024).toFixed(1)} KB • {new Date(file.createdAt?.seconds * 1000).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-dark">
                                        <Icon name="Download" size={18} />
                                    </a>
                                </div>
                            ))}
                            {files.length === 0 && (
                                <div className="text-center py-10">
                                    <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Icon name="Upload" size={24} className="text-text-secondary" />
                                    </div>
                                    <h3 className="text-lg font-medium text-text-primary">No files yet</h3>
                                    <p className="text-text-secondary mb-4 text-sm">Upload contracts, proposals, or other documents.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-text-primary">Activity Log</h3>
                        <div className="relative pl-4 border-l-2 border-border space-y-6">
                            {activities.map(activity => (
                                <div key={activity.id} className="relative">
                                    <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-surface ${activity.type === 'System' ? 'bg-gray-400' : 'bg-primary'
                                        }`}></div>
                                    <p className="text-sm text-text-primary">{activity.content}</p>
                                    <p className="text-xs text-text-secondary">
                                        {activity.createdAt?.seconds ? new Date(activity.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                                        {activity.createdByName && ` • ${activity.createdByName}`}
                                    </p>
                                </div>
                            ))}
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-primary rounded-full border-2 border-surface"></div>
                                <p className="text-sm text-text-primary">Lead created</p>
                                <p className="text-xs text-text-secondary">{lead.createdAt?.seconds ? new Date(lead.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeadDrawer;
