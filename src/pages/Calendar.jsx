import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, onSnapshot, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { addMonths, addWeeks, addDays, subMonths, subWeeks, subDays, format } from 'date-fns';
import ThreePaneLayout from '../components/layout/ThreePaneLayout';
import CalendarView from '../components/calendar/CalendarView';
import EventCreateModal from '../components/calendar/EventCreateModal';
import EventDrawer from '../components/calendar/EventDrawer';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';

const Calendar = () => {
    const { currentUser } = useAuth();
    const [events, setEvents] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [view, setView] = useState('month'); // month, week, day, agenda
    const [date, setDate] = useState(new Date());
    const [filters, setFilters] = useState({
        types: ['meeting', 'deadline', 'milestone', 'reminder', 'task'],
        projects: [],
        assignees: []
    });

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setView('day');
            }
        };

        // Initial check
        if (window.innerWidth < 768) {
            setView('day');
        }

        // Optional: Listen for resize if we want dynamic switching (users might not want this if they manually switched)
        // window.addEventListener('resize', handleResize);
        // return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch Calendar Events
    useEffect(() => {
        if (!currentUser?.companyId) return;
        const q = query(collection(db, 'calendarEvents'), where('companyId', '==', currentUser.companyId));
        const unsubscribeEvents = onSnapshot(q, (snapshot) => {
            const fetchedEvents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                start: doc.data().start?.toDate(),
                end: doc.data().end?.toDate(),
                isCalendarEvent: true
            }));
            setEvents(prev => {
                // Merge with tasks and milestones (handled in separate effects or here if we want to combine)
                // For now, let's just set calendar events and we'll add tasks later
                const otherEvents = prev.filter(e => !e.isCalendarEvent);
                return [...otherEvents, ...fetchedEvents];
            });
        });

        return () => unsubscribeEvents();
    }, [currentUser]);

    // Fetch Projects for Deadlines
    useEffect(() => {
        const fetchProjects = async () => {
            if (!currentUser?.companyId) return;
            try {
                const q = query(collection(db, 'projects'), where('companyId', '==', currentUser.companyId));
                const snapshot = await getDocs(q);
                const projectEvents = snapshot.docs
                    .map(doc => {
                        const data = doc.data();
                        // Use endDate for project deadline
                        if (!data.endDate) return null;

                        // Parse end date (assuming it's a string YYYY-MM-DD or Timestamp)
                        let start = null;
                        if (data.endDate?.toDate) {
                            start = data.endDate.toDate();
                        } else if (typeof data.endDate === 'string') {
                            start = new Date(data.endDate);
                        }

                        if (!start) return null;

                        // Set end date to same as start (all day or specific time)
                        // For deadlines, usually it's the end of the day or just a marker
                        return {
                            id: `proj-${doc.id}`,
                            title: `${data.name} Deadline`,
                            start: start,
                            end: start,
                            allDay: true,
                            type: 'deadline',
                            projectId: doc.id,
                            isProjectDeadline: true
                        };
                    })
                    .filter(Boolean);

                setEvents(prev => {
                    // Filter out old project deadlines to avoid duplicates if we re-fetch
                    const nonProjectEvents = prev.filter(e => !e.isProjectDeadline);
                    return [...nonProjectEvents, ...projectEvents];
                });
            } catch (error) {
                console.error("Error fetching project deadlines:", error);
            }
        };

        fetchProjects();
    }, [currentUser]);

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setIsDrawerOpen(true);
    };

    const handleSelectSlot = ({ start, end }) => {
        // Open create modal with pre-filled dates
        setSelectedEvent({ start, end }); // Temporary use of selectedEvent for passing dates
        setIsCreateModalOpen(true);
    };

    const handleNavigate = (action) => {
        let newDate = new Date(date);
        if (action === 'TODAY') {
            newDate = new Date();
        } else if (action === 'PREV') {
            if (view === 'month') newDate = subMonths(date, 1);
            else if (view === 'week') newDate = subWeeks(date, 1);
            else if (view === 'day') newDate = subDays(date, 1);
            else if (view === 'agenda') newDate = subMonths(date, 1);
        } else if (action === 'NEXT') {
            if (view === 'month') newDate = addMonths(date, 1);
            else if (view === 'week') newDate = addWeeks(date, 1);
            else if (view === 'day') newDate = addDays(date, 1);
            else if (view === 'agenda') newDate = addMonths(date, 1);
        }
        setDate(newDate);
    };

    return (
        <ThreePaneLayout>
            <div className="flex flex-col h-full">
                {/* Header */}
                {/* Header */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                        <h2 className="text-h3 font-bold text-text-primary whitespace-nowrap">Calendar</h2>

                        <div className="flex items-center gap-2 bg-surface border border-border rounded-md p-1 shadow-sm">
                            <button onClick={() => handleNavigate('PREV')} className="p-1.5 hover:bg-surface-secondary rounded-md text-text-secondary hover:text-text-primary">
                                <Icon name="ChevronLeft" size={18} />
                            </button>
                            <button onClick={() => handleNavigate('TODAY')} className="px-3 py-1.5 text-sm font-medium hover:bg-surface-secondary rounded-md text-text-secondary hover:text-text-primary">
                                Today
                            </button>
                            <button onClick={() => handleNavigate('NEXT')} className="p-1.5 hover:bg-surface-secondary rounded-md text-text-secondary hover:text-text-primary">
                                <Icon name="ChevronRight" size={18} />
                            </button>
                        </div>

                        <span className="text-xl font-semibold text-text-primary min-w-[160px] text-center hidden sm:block">
                            {format(date, 'MMMM yyyy')}
                        </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                        <div className="flex items-center bg-surface border border-border rounded-md p-1 w-full sm:w-auto shadow-sm">
                            {['month', 'week', 'day', 'agenda'].map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize flex-1 sm:flex-none transition-colors ${view === v
                                        ? 'bg-primary/10 text-primary shadow-sm'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                                        }`}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                        <Button onClick={() => { setSelectedEvent(null); setIsCreateModalOpen(true); }} className="w-full sm:w-auto justify-center whitespace-nowrap">
                            <Icon name="Plus" size={16} className="mr-2" /> Add Event
                        </Button>
                    </div>
                </div>

                {/* Calendar View */}
                <div className="flex-1 bg-surface rounded-lg border border-border overflow-hidden p-4">
                    <CalendarView
                        events={events}
                        view={view}
                        onView={setView}
                        date={date}
                        onNavigate={setDate}
                        onSelectEvent={handleEventClick}
                        onSelectSlot={handleSelectSlot}
                    />
                </div>

                {/* Modals & Drawers */}
                <EventCreateModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    initialDates={selectedEvent?.start ? { start: selectedEvent.start, end: selectedEvent.end } : null}
                />

                <EventDrawer
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    event={selectedEvent}
                />


            </div>
        </ThreePaneLayout>
    );
};

export default Calendar;
