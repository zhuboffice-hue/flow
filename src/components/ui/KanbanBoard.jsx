import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import Icon from './Icon';
import Badge from './Badge';
import Avatar from './Avatar';

const KanbanColumn = ({ id, title, count, children, onAdd, onMenu, onDropTask }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId && onDropTask) {
            onDropTask(taskId, id);
        }
    };

    return (
        <div
            className={cn(
                "flex flex-col w-80 shrink-0 h-full bg-gray-50 rounded-lg border transition-colors",
                isDragOver ? "border-primary bg-primary/5" : "border-border"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="flex items-center justify-between p-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <h4 className="text-small font-semibold text-text-primary">{title}</h4>
                    <Badge variant="secondary" className="bg-white">{count}</Badge>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={onAdd} className="text-muted hover:text-text-primary p-1 rounded hover:bg-gray-200" title="Quick Add Task">
                        <Icon name="Plus" size={16} />
                    </button>
                    <button onClick={onMenu} className="text-muted hover:text-text-primary p-1 rounded hover:bg-gray-200" title="Column Actions">
                        <Icon name="MoreHorizontal" size={16} />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {children}
            </div>
        </div>
    );
};

import { useAuth } from '../../context/AuthContext'; // Import useAuth

const KanbanCard = ({ id, title, tags, assignee, assigneeId, dueDate, priority, projectName, onClick }) => {
    const { currentUser } = useAuth();

    // Allow drag if:
    // 1. Task is unassigned (so it can be picked up)
    // 2. OR Current user is the assignee
    // 3. OR Current user is an Admin (optional but good practice, though strictly "assigned person" requested, I'll stick to assignee + unassigned default)

    // Strict interpretation: "only the assigned person".
    // I will interpret this as: You cannot move SOMEONE ELSE'S task.
    // If it's yours or nobody's, you can move it.
    const isDraggable = !assigneeId || (currentUser?.uid === assigneeId);

    const priorityColors = {
        High: "text-danger bg-danger/10",
        Medium: "text-warning bg-warning/10",
        Low: "text-success bg-success/10"
    };

    const handleDragStart = (e) => {
        if (!isDraggable) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('taskId', id);
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            draggable={isDraggable}
            onDragStart={handleDragStart}
            className={cn(
                "p-3 bg-surface rounded-md border border-border shadow-sm hover:shadow-md transition-shadow group relative",
                isDraggable ? "cursor-move active:cursor-grabbing" : "cursor-not-allowed opacity-80"
            )}
            onClick={onClick}
            title={!isDraggable ? "Only the assignee can move this task" : ""}
        >
            {/* Project Name Badge */}
            {projectName && (
                <div className="mb-2">
                    <span className="text-[10px] font-medium text-text-secondary bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 truncate max-w-full inline-block">
                        {projectName}
                    </span>
                </div>
            )}

            <div className="flex items-start justify-between mb-2">
                <h5 className="text-small font-medium text-text-primary leading-tight">{title}</h5>
                <button className="opacity-0 group-hover:opacity-100 text-muted hover:text-text-primary">
                    <Icon name="MoreHorizontal" size={14} />
                </button>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
                {tags && tags.map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-text-secondary rounded border border-gray-200">
                        {tag}
                    </span>
                ))}
            </div>

            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                    <Avatar size="xs" fallback={assignee?.charAt(0)} />
                    {dueDate && (
                        <span className="text-[10px] text-muted flex items-center gap-1">
                            <Icon name="Calendar" size={10} />
                            {dueDate}
                        </span>
                    )}
                </div>
                {priority && (
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", priorityColors[priority])}>
                        {priority}
                    </span>
                )}
            </div>
        </div>
    );
};

const KanbanBoard = ({ columns, tasks, onCardClick, onStatusChange, onAddClick, onMenuClick }) => {
    return (
        <div className="flex h-full overflow-x-auto gap-4 p-1">
            {columns.map(col => (
                <KanbanColumn
                    key={col.id}
                    id={col.id}
                    title={col.title}
                    count={tasks.filter(t => t.status === col.id).length}
                    onDropTask={onStatusChange}
                    onAdd={() => onAddClick && onAddClick(col.id)}
                    onMenu={() => onMenuClick && onMenuClick(col.id)}
                >
                    {tasks.filter(t => t.status === col.id).map(task => (
                        <KanbanCard
                            key={task.id}
                            {...task}
                            assignee={task.assigneeName} // Pass assignee name for avatar fallback
                            onClick={() => onCardClick && onCardClick(task)}
                        />
                    ))}
                </KanbanColumn>
            ))}
            <div className="w-80 shrink-0 flex items-center justify-center border-2 border-dashed border-border rounded-lg h-32 my-auto text-muted hover:text-text-primary hover:border-primary/50 cursor-pointer transition-colors">
                <div className="flex items-center gap-2 font-medium">
                    <Icon name="Plus" size={18} />
                    Add Section
                </div>
            </div>
        </div>
    );
};

export default KanbanBoard;
