import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Button from '../../ui/Button';
import Icon from '../../ui/Icon';

const ClientNotes = ({ clientId }) => {
    const [note, setNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    useEffect(() => {
        if (!clientId) return;

        const fetchNotes = async () => {
            try {
                const docRef = doc(db, 'clients', clientId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setNote(docSnap.data().notes || '');
                }
            } catch (error) {
                console.error("Error fetching notes:", error);
            }
        };

        fetchNotes();
    }, [clientId]);

    const handleSaveNotes = async () => {
        setIsSaving(true);
        try {
            const docRef = doc(db, 'clients', clientId);
            await updateDoc(docRef, { notes: note });
            setLastSaved(new Date());
        } catch (error) {
            console.error("Error saving notes:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-text-primary">Internal Notes</h3>
                <div className="flex items-center gap-3">
                    {lastSaved && <span className="text-xs text-text-secondary">Saved {lastSaved.toLocaleTimeString()}</span>}
                    <Button size="sm" onClick={handleSaveNotes} disabled={isSaving}>
                        {isSaving ? <Icon name="Loader2" className="animate-spin mr-2" size={14} /> : <Icon name="Save" className="mr-2" size={14} />}
                        Save Notes
                    </Button>
                </div>
            </div>
            <div className="bg-surface rounded-lg border border-border p-4">
                <textarea
                    className="w-full h-96 bg-transparent border-none resize-none focus:outline-none text-text-primary leading-relaxed"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Type your internal notes here..."
                />
            </div>
        </div>
    );
};

export default ClientNotes;
