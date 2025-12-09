import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ThreePaneLayout from '../components/layout/ThreePaneLayout';
import CalendarView from '../components/calendar/CalendarView';
import EventCreateModal from '../components/calendar/EventCreateModal';
import EventDrawer from '../components/calendar/EventDrawer';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';

const Calendar = () => {
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

    // Fetch Calendar Events
    useEffect(() => {
        const unsubscribeEvents = onSnapshot(collection(db, 'calendarEvents'), (snapshot) => {
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
    }, []);

    // Fetch Projects for Deadlines
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'projects'));
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
    }, []);

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setIsDrawerOpen(true);
    };

    const handleSelectSlot = ({ start, end }) => {
        // Open create modal with pre-filled dates
        setSelectedEvent({ start, end }); // Temporary use of selectedEvent for passing dates
        setIsCreateModalOpen(true);
    };

    return (
        <ThreePaneLayout>
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-h3 font-bold text-text-primary">Calendar</h2>
                        <div className="flex items-center bg-surface border border-border rounded-md p-1">
                            <button onClick={() => setView('month')} className={`px-3 py-1 text-sm rounded ${view === 'month' ? 'bg-primary/10 text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}>Month</button>
                            <button onClick={() => setView('week')} className={`px-3 py-1 text-sm rounded ${view === 'week' ? 'bg-primary/10 text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}>Week</button>
                            <button onClick={() => setView('day')} className={`px-3 py-1 text-sm rounded ${view === 'day' ? 'bg-primary/10 text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}>Day</button>
                            <button onClick={() => setView('agenda')} className={`px-3 py-1 text-sm rounded ${view === 'agenda' ? 'bg-primary/10 text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}>Agenda</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => { setSelectedEvent(null); setIsCreateModalOpen(true); }}>
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
