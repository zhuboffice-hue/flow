import React, { useState } from 'react';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const CreateTemplateModal = ({ onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'Design',
        content: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addDoc(collection(db, 'proposalTemplates'), {
                ...formData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastUsed: serverTimestamp()
            });
            onClose();
        } catch (error) {
            console.error("Error creating template: ", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-md border border-border">
                <div className="flex justify-between items-center p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-text-primary">New Template</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                        <Icon name="X" size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <Input
                        label="Template Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Web Design Proposal"
                    />
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary text-text-primary"
                        >
                            <option>Design</option>
                            <option>Marketing</option>
                            <option>Development</option>
                            <option>Consulting</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Default Content</label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            className="w-full h-32 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary text-text-primary resize-none"
                            placeholder="Enter default proposal text..."
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Template'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTemplateModal;
