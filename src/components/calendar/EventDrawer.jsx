import React, { useState, useEffect } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Drawer from '../ui/Drawer';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Icon from '../ui/Icon';

const EventDrawer = ({ isOpen, onClose, event }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (event) {
            // Fix: Adjust for timezone offset so datetime-local input receives the correct local time
            const formatDate = (date) => {
                if (!date) return '';
                const d = new Date(date);
                d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                return d.toISOString().slice(0, 16);
            };

            setFormData({
                ...event,
                start: formatDate(event.start),
                end: formatDate(event.end)
            });
            setIsEditing(false);
        }
    }, [event]);

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const eventRef = doc(db, 'calendarEvents', event.id);
            await updateDoc(eventRef, {
                ...formData,
                start: new Date(formData.start),
                end: new Date(formData.end),
                updatedAt: new Date()
            });
            setIsEditing(false);
            onClose();
        } catch (error) {
            console.error("Error updating event:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this event?")) {
            setLoading(true);
            try {
                await deleteDoc(doc(db, 'calendarEvents', event.id));
                onClose();
            } catch (error) {
                console.error("Error deleting event:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    if (!event) return null;

    return (
        <Drawer isOpen={isOpen} onClose={onClose} title={isEditing ? "Edit Event" : "Event Details"}>
            <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {isEditing ? (
                        <div className="space-y-4">
                            <Input
                                label="Title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                            <Select
                                label="Type"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                options={[
                                    { value: 'meeting', label: 'Meeting' },
                                    { value: 'deadline', label: 'Deadline' },
                                    { value: 'milestone', label: 'Milestone' },
                                    { value: 'reminder', label: 'Reminder' },
                                ]}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    type="datetime-local"
                                    label="Start"
                                    value={formData.start}
                                    onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                                />
                                <Input
                                    type="datetime-local"
                                    label="End"
                                    value={formData.end}
                                    onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                                />
                            </div>
                            <Input
                                label="Location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                            <TextArea
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                            />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-h3 font-bold text-text-primary">{event.title}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${event.type === 'meeting' ? 'bg-purple-100 text-purple-700' :
                                        event.type === 'deadline' ? 'bg-red-100 text-red-700' :
                                            event.type === 'milestone' ? 'bg-amber-100 text-amber-700' :
                                                'bg-blue-100 text-blue-700'
                                        }`}>
                                        {event.type}
                                    </span>
                                    {event.projectName && (
                                        <span className="bg-gray-100 text-text-secondary px-2 py-0.5 rounded text-xs">
                                            {event.projectName}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Icon name="Calendar" size={18} className="text-muted mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-text-primary">
                                            {event.start?.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-text-secondary">to {event.end?.toLocaleString()}</p>
                                    </div>
                                </div>

                                {event.location && (
                                    <div className="flex items-center gap-3">
                                        <Icon name="MapPin" size={18} className="text-muted" />
                                        <p className="text-sm text-text-primary">{event.location}</p>
                                    </div>
                                )}

                                {event.description && (
                                    <div className="flex items-start gap-3">
                                        <Icon name="AlignLeft" size={18} className="text-muted mt-0.5" />
                                        <p className="text-sm text-text-secondary whitespace-pre-wrap">{event.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-border bg-gray-50 flex justify-between items-center">
                    {isEditing ? (
                        <>
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button onClick={handleUpdate} disabled={loading}>Save Changes</Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" className="text-danger hover:text-danger hover:bg-danger/10" onClick={handleDelete}>
                                <Icon name="Trash2" size={16} className="mr-2" /> Delete
                            </Button>
                            <Button variant="secondary" onClick={() => setIsEditing(true)}>
                                <Icon name="Edit" size={16} className="mr-2" /> Edit
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </Drawer>
    );
};

export default EventDrawer;
