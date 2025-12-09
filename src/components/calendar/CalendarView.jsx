import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const CalendarView = ({ events, view, onView, date, onNavigate, onSelectEvent, onSelectSlot }) => {

    const eventStyleGetter = (event, start, end, isSelected) => {
        let backgroundColor = '#3174ad';

        switch (event.type) {
            case 'meeting': backgroundColor = '#8b5cf6'; break; // Purple
            case 'deadline': backgroundColor = '#ef4444'; break; // Red
            case 'milestone': backgroundColor = '#f59e0b'; break; // Amber
            case 'reminder': backgroundColor = '#10b981'; break; // Emerald
            case 'task': backgroundColor = '#3b82f6'; break; // Blue
            default: backgroundColor = '#6b7280'; // Gray
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block',
                fontSize: '0.75rem', // Smaller font
                padding: '2px 4px'
            }
        };
    };

    const CustomEvent = ({ event }) => {
        return (
            <div className="flex items-center justify-between h-full overflow-hidden">
                <span className="truncate flex-1">{event.title}</span>
                <button
                    className="ml-1 bg-white/20 hover:bg-white/40 text-white rounded px-1 py-0.5 text-[10px] uppercase font-bold tracking-wider"
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent parent click
                        onSelectEvent(event);
                    }}
                >
                    View
                </button>
            </div>
        );
    };

    return (
        <div style={{ height: 'calc(100vh - 200px)' }}>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                view={view}
                onView={onView}
                date={date}
                onNavigate={onNavigate}
                onSelectEvent={onSelectEvent}
                onSelectSlot={onSelectSlot}
                selectable
                eventPropGetter={eventStyleGetter}
                components={{
                    event: CustomEvent
                }}
                views={['month', 'week', 'day', 'agenda']}
            />
        </div>
    );
};

export default CalendarView;
