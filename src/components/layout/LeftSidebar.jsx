import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import Icon from '../ui/Icon';
import { useAuth } from '../../context/AuthContext';

const navGroups = [
    {
        title: null, // "Main" group - no header needed
        items: [
            { name: 'Dashboard', icon: 'LayoutDashboard', path: '/app' },
            { name: 'Calendar', icon: 'Calendar', path: '/app/calendar' },
        ]
    },
    {
        title: 'Workspace',
        items: [
            { name: 'Projects', icon: 'Folder', path: '/app/projects' },
            { name: 'Tasks', icon: 'CheckSquare', path: '/app/tasks' },
            { name: 'Files', icon: 'FileText', path: '/app/files' },
        ]
    },
    {
        title: 'CRM & Sales',
        items: [
            { name: 'Clients', icon: 'Users', path: '/app/clients' },
            { name: 'Sales', icon: 'TrendingUp', path: '/app/sales' },
        ]
    },
    {
        title: 'Business',
        items: [
            { name: 'Finance', icon: 'CreditCard', path: '/app/finance' },
            { name: 'People', icon: 'User', path: '/app/team' },
        ]
    },
    {
        title: 'System',
        items: [
            { name: 'Automation', icon: 'Zap', path: '/app/automation' },
            { name: 'Analytics', icon: 'BarChart2', path: '/app/analytics' },
            { name: 'Settings', icon: 'Settings', path: '/app/settings' },
        ]
    }
];

import { useTheme } from '../../context/ThemeContext'; // Import useTheme

const LeftSidebar = ({ className, onCollapse }) => {
    const { currentUser, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme(); // Use global theme context

    // Removed local state and useEffect

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <aside className={cn("flex flex-col w-64 h-full border-r border-border bg-background transition-all", className)}>
            {/* Header */}
            <div className="flex items-center h-16 px-6 border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="bg-primary rounded-md p-1">
                        <Icon name="Layers" className="text-white" size={20} />
                    </div>
                    <span className="text-h3 font-bold text-text-primary">FLOW</span>
                </div>
                <button
                    onClick={onCollapse}
                    className="ml-auto text-muted hover:text-text-primary p-1 rounded-md hover:bg-surface transition-colors"
                >
                    <Icon name="ChevronsLeft" size={20} />
                </button>
            </div>

            {/* Company Selector */}
            <div className="p-4">
                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-surface border border-transparent hover:border-border cursor-pointer transition-colors">
                    <div className="bg-gray-200 p-2 rounded-md">
                        <Icon name="Building2" size={20} className="text-text-secondary" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-small font-medium text-text-primary truncate">Company Management</p>
                        <p className="text-xs text-text-secondary truncate">{currentUser?.company?.name || 'Loading...'}</p>
                    </div>
                    <Icon name="ChevronDown" size={16} className="text-muted" />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
                {navGroups.map((group, groupIndex) => (
                    <div key={groupIndex}>
                        {group.title && (
                            <h4 className="px-3 mb-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                {group.title}
                            </h4>
                        )}
                        <div className="space-y-0.5">
                            {group.items.map((item) => (
                                <NavLink
                                    key={item.name}
                                    to={item.path}
                                    end={item.path === '/app'}
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-md text-small font-medium transition-colors",
                                            isActive
                                                ? "bg-primary text-white"
                                                : "text-text-secondary hover:bg-surface hover:text-text-primary"
                                        )
                                    }
                                >
                                    <Icon name={item.icon} size={18} />
                                    {item.name}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border space-y-2">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-surface transition-colors cursor-pointer" onClick={toggleTheme}>
                    <div className="flex items-center gap-2 text-text-secondary">
                        <Icon name={isDark ? "Moon" : "Sun"} size={16} />
                        <span className="text-small">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                    </div>
                    {/* Simple Switch UI */}
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${isDark ? 'bg-primary' : 'bg-gray-300'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${isDark ? 'left-4.5 translate-x-3.5' : 'left-0.5'}`}></div>
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-text-secondary hover:text-danger hover:bg-red-50 rounded-md transition-colors"
                >
                    <Icon name="LogOut" size={16} />
                    <span className="text-small">Isign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default LeftSidebar;
