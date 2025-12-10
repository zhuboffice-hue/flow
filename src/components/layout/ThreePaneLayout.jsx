import React, { useState } from 'react';
import LeftSidebar from './LeftSidebar';
import Topbar from './Topbar';
import { cn } from '../../lib/utils';

const ThreePaneLayout = ({ children, className }) => {
    // Initialize sidebar state based on screen width
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    React.useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) {
                setIsSidebarOpen(true);
            } else {
                setIsSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden relative">
            {/* Mobile Sidebar Overlay */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Left Pane: Sidebar */}
            {/* On mobile: fixed, z-50. On desktop: relative, flex-shrink-0 */}
            <div className={cn(
                "transition-all duration-300 ease-in-out h-full bg-background border-r border-border",
                isMobile ? "fixed left-0 top-0 z-50 shadow-xl" : "relative flex-shrink-0",
                !isSidebarOpen && !isMobile && "hidden", // Hidden on desktop when collapsed
                isMobile && !isSidebarOpen && "-translate-x-full" // Slide out on mobile
            )}>
                <LeftSidebar
                    className="h-full"
                    onCollapse={() => setIsSidebarOpen(false)}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 min-w-0">
                <Topbar
                    showMenuTrigger={!isSidebarOpen || isMobile}
                    onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
                />

                <main className={cn("flex-1 overflow-y-auto p-4 md:p-6", className)}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default ThreePaneLayout;
