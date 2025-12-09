import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

const MessageModal = ({ isOpen, onClose, recipientId, recipientName, recipientEmail }) => {
    const { currentUser } = useAuth();
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!message.trim()) return;
        setLoading(true);

        try {
            await addDoc(collection(db, 'notifications'), {
                recipientId: recipientId || null,
                recipientEmail: recipientEmail || null,
                senderId: currentUser.uid,
                senderName: currentUser.name || currentUser.email,
                content: message,
                type: 'message',
                isRead: false,
                createdAt: new Date()
            });

            setMessage('');
            onClose();
            // Optional: Show success toast
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Message ${recipientName}`}
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSend} disabled={loading || !message.trim()}>
                        {loading ? 'Sending...' : 'Send Message'}
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                <textarea
                    className="w-full h-32 p-3 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
            </div>
        </Modal>
    );
};

export default MessageModal;
