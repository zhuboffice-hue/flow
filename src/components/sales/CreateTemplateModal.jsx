import React, { useState } from 'react';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { uploadToCloudinary } from '../../lib/cloudinary';

const CreateTemplateModal = ({ onClose, initialData = null }) => {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        type: initialData?.type || 'Design',
        content: initialData?.content || ''
    });
    const [loading, setLoading] = useState(false);
    const [attachment, setAttachment] = useState(null);
    const [uploading, setUploading] = useState(false);

    // If editing, keep track of existing attachment
    const [existingAttachment, setExistingAttachment] = useState(initialData?.attachment || null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let fileData = existingAttachment; // Default to existing if no new one

            if (attachment) {
                setUploading(true);
                const url = await uploadToCloudinary(attachment);
                fileData = {
                    name: attachment.name,
                    url: url,
                    size: (attachment.size / 1024).toFixed(2) + ' KB',
                    type: attachment.type
                };
                setUploading(false);
            }

            if (initialData) {
                // Update existing
                await updateDoc(doc(db, 'proposalTemplates', initialData.id), {
                    ...formData,
                    attachment: fileData,
                    updatedAt: serverTimestamp()
                });
            } else {
                // Create new
                await addDoc(collection(db, 'proposalTemplates'), {
                    ...formData,
                    attachment: fileData,
                    companyId: currentUser.companyId,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    lastUsed: serverTimestamp()
                });
            }
            onClose();
        } catch (error) {
            console.error("Error saving template: ", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-md border border-border">
                <div className="flex justify-between items-center p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-text-primary">
                        {initialData ? 'Edit Template' : 'New Template'}
                    </h2>
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

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Attachment (Optional)</label>

                        {/* Show existing attachment if any */}
                        {existingAttachment && !attachment && (
                            <div className="flex items-center gap-2 mb-2 p-2 bg-surface-secondary/30 rounded border border-border">
                                <Icon name="File" size={16} className="text-primary" />
                                <span className="text-sm text-text-secondary truncate flex-1">
                                    {existingAttachment.name}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setExistingAttachment(null)}
                                    className="text-text-secondary hover:text-danger"
                                >
                                    <Icon name="X" size={14} />
                                </button>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <label className="cursor-pointer bg-surface-secondary hover:bg-surface-secondary/80 border border-border rounded-md px-3 py-2 text-sm text-text-primary flex items-center gap-2 transition-colors">
                                <Icon name="Upload" size={16} />
                                {attachment ? 'Change File' : 'Upload New File'}
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => setAttachment(e.target.files[0])}
                                />
                            </label>
                            {attachment && (
                                <span className="text-sm text-text-secondary truncate max-w-[200px]">
                                    {attachment.name}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (uploading ? 'Uploading...' : 'Saving...') : (initialData ? 'Update Template' : 'Create Template')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTemplateModal;
