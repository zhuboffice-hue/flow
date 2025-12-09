import React, { useState } from 'react';
import LeftSidebar from './LeftSidebar';
import Topbar from './Topbar';
import { cn } from '../../lib/utils';

const ThreePaneLayout = ({ children, className }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden">
            {/* Left Pane: Sidebar */}
            {isSidebarOpen && (
                <LeftSidebar
                    className="flex-shrink-0"
                    onCollapse={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 min-w-0">
                <Topbar
                    showMenuTrigger={!isSidebarOpen}
                    onMenuClick={() => setIsSidebarOpen(true)}
                />

                <main className={cn("flex-1 overflow-y-auto p-6", className)}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default ThreePaneLayout;
