import React from 'react';
import Icon from '../ui/Icon';

const StatCard = ({ title, value, icon, trend, trendUp }) => (
    <div className="bg-surface p-4 rounded-lg border border-border">
        <div className="flex justify-between items-start mb-2">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
                <Icon name={icon} size={20} />
            </div>
            {trend && (
                <span className={`text-xs font-medium ${trendUp ? 'text-success' : 'text-danger'} flex items-center`}>
                    {trendUp ? <Icon name="TrendingUp" size={12} className="mr-1" /> : <Icon name="TrendingDown" size={12} className="mr-1" />}
                    {trend}
                </span>
            )}
        </div>
        <h3 className="text-2xl font-bold text-text-primary mb-1">{value}</h3>
        <p className="text-sm text-text-secondary">{title}</p>
    </div>
);

const ProjectsStats = ({ projects }) => {
    const total = projects.length;
    const active = projects.filter(p => p.status === 'In Progress').length;
    const planning = projects.filter(p => p.status === 'Planning').length;
    const completed = projects.filter(p => p.status === 'Completed').length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard title="Total Projects" value={total} icon="Folder" />
            <StatCard title="Active Projects" value={active} icon="Activity" trend="+2 this month" trendUp={true} />
            <StatCard title="In Planning" value={planning} icon="Calendar" />
            <StatCard title="Completed" value={completed} icon="CheckCircle" trend="+5 this month" trendUp={true} />
        </div>
    );
};

export default ProjectsStats;
