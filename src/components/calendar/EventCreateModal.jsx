import React, { useState, useEffect } from 'react';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';

const EventCreateModal = ({ isOpen, onClose, initialDates }) => {
    const [title, setTitle] = useState('');
    const [type, setType] = useState('meeting');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [projectId, setProjectId] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Reset form or set initial dates
            if (initialDates) {
                // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
                const formatDate = (date) => {
                    if (!date) return '';
                    const d = new Date(date);
                    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                    return d.toISOString().slice(0, 16);
                };
                setStart(formatDate(initialDates.start));
                setEnd(formatDate(initialDates.end));
            } else {
                setStart('');
                setEnd('');
            }
            setTitle('');
            setType('meeting');
            setProjectId('');
            setDescription('');
            setLocation('');
        }
    }, [isOpen, initialDates]);

    useEffect(() => {
        const fetchProjects = async () => {
            const snapshot = await getDocs(collection(db, 'projects'));
            setProjects(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
        };
        fetchProjects();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addDoc(collection(db, 'calendarEvents'), {
                title,
                type,
                start: new Date(start),
                end: new Date(end),
                projectId: projectId || null,
                description,
                location,
                createdAt: new Date(),
                createdBy: 'current-user-id' // Replace with actual user ID
            });
            onClose();
        } catch (error) {
            console.error("Error creating event:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Event">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Event Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g., Weekly Team Sync"
                />

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Event Type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        options={[
                            { value: 'meeting', label: 'Meeting' },
                            { value: 'deadline', label: 'Deadline' },
                            { value: 'milestone', label: 'Milestone' },
                            { value: 'reminder', label: 'Reminder' },
                        ]}
                    />
                    <Select
                        label="Project (Optional)"
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        options={[
                            { value: '', label: 'None' },
                            ...projects.map(p => ({ value: p.id, label: p.name }))
                        ]}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        type="datetime-local"
                        label="Start Time"
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                        required
                    />
                    <Input
                        type="datetime-local"
                        label="End Time"
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                        required
                    />
                </div>

                <Input
                    label="Location / Link"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Conference Room A or Zoom Link"
                />

                <TextArea
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add details, agenda, or notes..."
                    rows={3}
                />

                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Event'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default EventCreateModal;
