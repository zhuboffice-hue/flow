import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { initialTimeEntryState } from '../../../lib/models';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Icon from '../../ui/Icon';
import Avatar from '../../ui/Avatar';

const TimeTracker = ({ taskId, projectId }) => {
    const { currentUser } = useAuth();
    const [entries, setEntries] = useState([]);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerStart, setTimerStart] = useState(null);
    const [elapsed, setElapsed] = useState(0);
    const [manualEntry, setManualEntry] = useState({ hours: 0, minutes: 0, notes: '' });

    useEffect(() => {
        if (!taskId || !projectId) return;

        const q = query(collection(db, 'projects', projectId, 'tasks', taskId, 'timeEntries'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [taskId, projectId]);

    useEffect(() => {
        let interval;
        if (isTimerRunning && timerStart) {
            interval = setInterval(() => {
                setElapsed(Math.floor((Date.now() - timerStart) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timerStart]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStartTimer = () => {
        setTimerStart(Date.now());
        setIsTimerRunning(true);
    };

    const handleStopTimer = async () => {
        if (!currentUser) return;
        setIsTimerRunning(false);
        const durationHours = elapsed / 3600;
        try {
            await addDoc(collection(db, 'projects', projectId, 'tasks', taskId, 'timeEntries'), {
                ...initialTimeEntryState,
                taskId,
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email,
                userAvatar: currentUser.photoURL,
                startTime: new Date(timerStart),
                endTime: new Date(),
                durationHours,
                createdAt: new Date()
            });
            setElapsed(0);
            setTimerStart(null);
        } catch (error) {
            console.error("Error saving timer entry:", error);
        }
    };

    const handleManualLog = async () => {
        if (!currentUser) return;
        const durationHours = parseFloat(manualEntry.hours) + (parseFloat(manualEntry.minutes) / 60);
        if (durationHours <= 0) return;

        try {
            await addDoc(collection(db, 'projects', projectId, 'tasks', taskId, 'timeEntries'), {
                ...initialTimeEntryState,
                taskId,
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email,
                userAvatar: currentUser.photoURL,
                startTime: new Date(), // Approximate
                endTime: new Date(),
                durationHours,
                notes: manualEntry.notes,
                createdAt: new Date()
            });
            setManualEntry({ hours: 0, minutes: 0, notes: '' });
        } catch (error) {
            console.error("Error logging time:", error);
        }
    };

    const handleDeleteEntry = async (entryId) => {
        try {
            await deleteDoc(doc(db, 'projects', projectId, 'tasks', taskId, 'timeEntries', entryId));
        } catch (error) {
            console.error("Error deleting time entry:", error);
        }
    };

    const totalHours = entries.reduce((acc, entry) => acc + entry.durationHours, 0);

    return (
        <div className="space-y-6">
            {/* Timer Section */}
            <div className="bg-surface-secondary p-4 rounded-lg border border-border flex flex-col items-center gap-4">
                <div className="text-4xl font-mono font-bold text-text-primary">
                    {formatTime(elapsed)}
                </div>
                <div className="flex gap-2">
                    {!isTimerRunning ? (
                        <Button onClick={handleStartTimer} className="w-32">
                            <Icon name="Play" size={16} className="mr-2" /> Start
                        </Button>
                    ) : (
                        <Button onClick={handleStopTimer} variant="danger" className="w-32">
                            <Icon name="Square" size={16} className="mr-2" /> Stop
                        </Button>
                    )}
                </div>
            </div>

            {/* Manual Entry */}
            <div className="space-y-3">
                <h4 className="font-medium text-text-primary">Log Time Manually</h4>
                <div className="flex gap-2">
                    <div className="w-20">
                        <Input
                            type="number"
                            placeholder="Hrs"
                            value={manualEntry.hours}
                            onChange={(e) => setManualEntry({ ...manualEntry, hours: e.target.value })}
                        />
                    </div>
                    <div className="w-20">
                        <Input
                            type="number"
                            placeholder="Min"
                            value={manualEntry.minutes}
                            onChange={(e) => setManualEntry({ ...manualEntry, minutes: e.target.value })}
                        />
                    </div>
                    <div className="flex-1">
                        <Input
                            placeholder="Notes (optional)"
                            value={manualEntry.notes}
                            onChange={(e) => setManualEntry({ ...manualEntry, notes: e.target.value })}
                        />
                    </div>
                    <Button onClick={handleManualLog} variant="secondary">Log</Button>
                </div>
            </div>

            {/* Entries List */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-text-primary">Time Logs</h4>
                    <span className="text-sm font-bold text-text-primary">Total: {totalHours.toFixed(2)} hrs</span>
                </div>
                <div className="space-y-2">
                    {entries.map(entry => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-surface border border-border rounded-md">
                            <div className="flex items-center gap-3">
                                <Avatar
                                    size="xs"
                                    src={entry.userAvatar}
                                    fallback={entry.userName?.charAt(0)}
                                />
                                <div>
                                    <div className="text-sm font-medium text-text-primary">
                                        {entry.durationHours.toFixed(2)} hrs
                                    </div>
                                    <div className="text-xs text-muted">
                                        {entry.createdAt?.toDate().toLocaleDateString()} • {entry.notes || 'No notes'}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => handleDeleteEntry(entry.id)} className="text-muted hover:text-danger p-1">
                                <Icon name="Trash2" size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TimeTracker;
