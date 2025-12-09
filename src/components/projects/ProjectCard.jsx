import React from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Badge from '../ui/Badge';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import { useCurrency } from '../../hooks/useCurrency';

const ProjectCard = ({ project, onClick }) => {
    const { formatCurrency } = useCurrency();

    const handleStatusChange = async (e) => {
        e.stopPropagation();
        const newStatus = e.target.value;
        try {
            await updateDoc(doc(db, 'projects', project.id), { status: newStatus });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const statusColors = {
        'Planning': 'bg-warning/10 text-warning',
        'In Progress': 'bg-primary/10 text-primary',
        'Completed': 'bg-success/10 text-success',
        'On Hold': 'bg-gray-100 text-gray-600',
        'Draft': 'bg-gray-100 text-gray-600'
    };

    return (
        <div
            className="bg-surface rounded-lg border border-border p-4 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={onClick}
        >
            <div className="flex justify-between items-center mb-3">
                <select
                    className={`text-xs font-medium px-2 py-1 rounded-full border-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer ${statusColors[project.status] || statusColors['Draft']}`}
                    value={project.status || 'Draft'}
                    onClick={(e) => e.stopPropagation()}
                    onChange={handleStatusChange}
                >
                    <option value="Draft">Draft</option>
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                </select>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icon name="MoreVertical" size={16} />
                </Button>
            </div>

            <h3 className="font-bold text-lg text-text-primary mb-1 truncate" title={project.name}>{project.name}</h3>
            <p className="text-sm text-text-secondary mb-4 line-clamp-2 h-10">{project.description || 'No description provided.'}</p>

            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Progress</span>
                    <span className="font-medium text-text-primary">{project.progress || 0}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${project.progress || 0}%` }}
                    ></div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border">
                    <div className="flex -space-x-2">
                        {/* Placeholder for team avatars */}
                        <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-surface flex items-center justify-center text-[10px]">M</div>
                        <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-surface flex items-center justify-center text-[10px]">+</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-xs font-medium text-text-primary bg-surface-secondary px-2 py-1 rounded">
                            {formatCurrency(project.budget, project.currency)}
                        </div>
                        <div className="flex items-center text-xs text-text-secondary">
                            <Icon name="Calendar" size={12} className="mr-1" />
                            {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No deadline'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;
