import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import Input from '../ui/Input';
import TaskDrawer from '../tasks/TaskDrawer';
import CreateProjectModal from '../projects/CreateProjectModal';
import ClientFormModal from '../clients/ClientFormModal';
import CreateLeadModal from '../sales/CreateLeadModal';

const Topbar = ({ className, showMenuTrigger, onMenuClick }) => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Quick Add Modals
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [clientModalOpen, setClientModalOpen] = useState(false);
    const [leadModalOpen, setLeadModalOpen] = useState(false);

    useEffect(() => {
        if (!currentUser) return;
        // ... (existing notification logic)
        const q = query(
            collection(db, 'notifications'),
            where('recipientEmail', '==', currentUser.email)
        );
        const qUid = query(
            collection(db, 'notifications'),
            where('recipientId', '==', currentUser.uid)
        );

        const unsubscribeEmail = onSnapshot(q, (snapshot) => {
            const emailNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotifications(prev => {
                const combined = [...prev, ...emailNotifs].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
                combined.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
                return combined;
            });
        });

        const unsubscribeUid = onSnapshot(qUid, (snapshot) => {
            const uidNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotifications(prev => {
                const combined = [...prev, ...uidNotifs].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
                combined.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
                return combined;
            });
        });

        const handleClickOutside = (e) => {
            if (!e.target.closest('.quick-add-container')) {
                setShowQuickAdd(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            unsubscribeEmail();
            unsubscribeUid();
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [currentUser]);

    // ... (existing unreadCount etc)

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleMarkAsRead = async (notificationId) => {
        try {
            await updateDoc(doc(db, 'notifications', notificationId), {
                isRead: true
            });
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const quickAddOptions = [
        { label: 'New Task', icon: 'CheckSquare', action: () => setTaskModalOpen(true) },
        { label: 'New Project', icon: 'FolderPlus', action: () => setProjectModalOpen(true) },
        { label: 'New Lead', icon: 'Users', action: () => setLeadModalOpen(true) },
        { label: 'New Client', icon: 'Briefcase', action: () => setClientModalOpen(true) },
    ];

    return (
        <header className={cn("flex items-center justify-between h-16 px-4 md:px-6 border-b border-border bg-surface", className)}>
            <div className="flex-1 max-w-xl flex items-center gap-4">
                {showMenuTrigger && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onMenuClick}
                        className="text-text-secondary hover:text-text-primary md:hidden"
                    >
                        <Icon name="Menu" size={20} />
                    </Button>
                )}
                {/* Search - Hide on mobile for now to save space, or make it expandable */}
                <div className="relative flex-1 hidden md:block">
                    <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Search (Ctrl+K)"
                        className="w-full h-10 pl-10 pr-4 rounded-md border border-border bg-background text-small focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-4 ml-2 md:ml-4">
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted hover:text-text-primary relative"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Icon name="Bell" size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border-2 border-surface"></span>
                        )}
                    </Button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                            <div className="p-3 border-b border-border font-medium text-sm">Notifications</div>
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-text-secondary text-sm">No notifications</div>
                            ) : (
                                notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        className={cn(
                                            "p-3 border-b border-border last:border-0 hover:bg-background cursor-pointer",
                                            !notif.isRead && "bg-primary/5"
                                        )}
                                        onClick={() => handleMarkAsRead(notif.id)}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-semibold text-sm text-text-primary">{notif.senderName}</span>
                                            <span className="text-xs text-text-secondary">
                                                {notif.createdAt?.seconds ? new Date(notif.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-text-secondary line-clamp-2">{notif.content}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-border hidden md:block"></div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <p className="text-small font-medium text-text-primary">{currentUser?.name || 'User'}</p>
                        <p className="text-xs text-text-secondary">{currentUser?.role || 'Member'}</p>
                    </div>
                    {/* User Avatar - clickable for mobile profile maybe? */}
                    <Avatar src={currentUser?.photoURL} fallback={getInitials(currentUser?.name)} size="md" />
                </div>

                <div className="relative quick-add-container">
                    <Button
                        variant="primary"
                        size="sm"
                        icon="Plus"
                        onClick={() => setShowQuickAdd(!showQuickAdd)}
                        className="hidden md:flex"
                    >
                        Quick Add
                    </Button>
                    {/* Mobile Plus Icon only */}
                    <Button
                        variant="primary"
                        size="icon"
                        onClick={() => setShowQuickAdd(!showQuickAdd)}
                        className="md:hidden w-8 h-8 md:w-auto md:h-auto"
                    >
                        <Icon name="Plus" size={18} />
                    </Button>

                    {showQuickAdd && (
                        <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg z-50 py-1">
                            {quickAddOptions.map((opt, i) => (
                                <button
                                    key={i}
                                    className="w-full text-left px-4 py-2 hover:bg-background flex items-center gap-2 text-sm text-text-primary"
                                    onClick={() => {
                                        opt.action();
                                        setShowQuickAdd(false);
                                    }}
                                >
                                    <Icon name={opt.icon} size={16} className="text-primary" />
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Global Modals */}
            <TaskDrawer
                isOpen={taskModalOpen}
                onClose={() => setTaskModalOpen(false)}
                // No projectId passed, will trigger selector
                onSave={() => { /* maybe refresh tasks if on tasks page? */ }}
            />

            <CreateProjectModal
                isOpen={projectModalOpen}
                onClose={() => setProjectModalOpen(false)}
            />

            <ClientFormModal
                isOpen={clientModalOpen}
                onClose={() => setClientModalOpen(false)}
            />

            <CreateLeadModal
                isOpen={leadModalOpen}
                onClose={() => setLeadModalOpen(false)}
            />
        </header>
    );
};

export default Topbar;
