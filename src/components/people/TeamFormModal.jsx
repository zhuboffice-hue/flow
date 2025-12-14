import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

const TeamFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
        } else {
            setName('');
        }
    }, [initialData, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ name });
        onClose();
        setName('');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Team" : "Add Team"}
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>{initialData ? "Save Changes" : "Create Team"}</Button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Team Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Frontend, Marketing Ops"
                    autoFocus
                />
            </form>
        </Modal>
    );
};

export default TeamFormModal;
