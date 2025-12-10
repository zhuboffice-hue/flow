import React, { useState, useEffect } from 'react';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import CreateTemplateModal from './CreateTemplateModal';
import ViewTemplateModal from './ViewTemplateModal';
import { collection, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

const ProposalTemplates = () => {
    const { currentUser } = useAuth();
    const [templates, setTemplates] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null); // For View
    const [editingTemplate, setEditingTemplate] = useState(null); // For Edit

    useEffect(() => {
        if (!currentUser?.companyId) return;
        const q = query(collection(db, 'proposalTemplates'), where('companyId', '==', currentUser.companyId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Client-side sort to avoid composite index requirement
            data.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA; // Descending
            });
            setTemplates(data);
        });
        return () => unsubscribe();
    }, [currentUser]);

    const handleDelete = async (templateId, e) => {
        e.stopPropagation(); // Prevent opening view modal
        if (window.confirm('Are you sure you want to delete this template? This cannot be undone.')) {
            try {
                await deleteDoc(doc(db, 'proposalTemplates', templateId));
            } catch (error) {
                console.error("Error deleting template:", error);
                alert("Failed to delete template.");
            }
        }
    };

    const handleEdit = (template, e) => {
        e.stopPropagation();
        setEditingTemplate(template);
    };

    const handleView = (template) => {
        setSelectedTemplate(template);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Never';
        // Handle Firestore Timestamp or JS Date
        const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        return date.toLocaleDateString();
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-text-primary">Proposal Templates</h2>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Icon name="Plus" size={16} className="mr-2" /> New Template
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                    <div
                        key={template.id}
                        onClick={() => handleView(template)}
                        className="bg-surface p-6 rounded-lg border border-border hover:shadow-md transition-shadow cursor-pointer group relative"
                    >
                        {/* Type Icon */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-md bg-primary/10 text-primary">
                                <Icon name={template.attachment ? "Paperclip" : "FileText"} size={24} />
                            </div>

                            {/* Actions Menu (Visible on Hover) */}
                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => handleEdit(template, e)}
                                    className="p-1.5 text-text-secondary hover:text-primary hover:bg-primary/5 rounded"
                                    title="Edit"
                                >
                                    <Icon name="Edit" size={16} />
                                </button>
                                <button
                                    onClick={(e) => handleDelete(template.id, e)}
                                    className="p-1.5 text-text-secondary hover:text-danger hover:bg-danger/5 rounded"
                                    title="Delete"
                                >
                                    <Icon name="Trash2" size={16} />
                                </button>
                            </div>
                        </div>

                        <h3 className="font-bold text-lg text-text-primary mb-1 truncate">{template.name}</h3>
                        <p className="text-sm text-text-secondary mb-4">{template.type}</p>

                        <div className="flex justify-between items-center text-xs text-text-secondary border-t border-border pt-4 mt-auto">
                            <span>Last used: {formatDate(template.lastUsed)}</span>
                            <span className="text-primary group-hover:underline">View Details</span>
                        </div>
                    </div>
                ))}

                {/* Add New Template Card */}
                <div
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-surface-secondary/30 p-6 rounded-lg border border-dashed border-border flex flex-col items-center justify-center text-text-secondary hover:text-primary hover:border-primary hover:bg-primary/5 transition-all cursor-pointer h-full min-h-[200px]"
                >
                    <Icon name="Plus" size={32} className="mb-2" />
                    <span className="font-medium">Create New Template</span>
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <CreateTemplateModal onClose={() => setIsCreateModalOpen(false)} />
            )}

            {/* Edit Modal */}
            {editingTemplate && (
                <CreateTemplateModal
                    initialData={editingTemplate}
                    onClose={() => setEditingTemplate(null)}
                />
            )}

            {/* View Modal */}
            {selectedTemplate && (
                <ViewTemplateModal
                    template={selectedTemplate}
                    onClose={() => setSelectedTemplate(null)}
                    onEdit={() => {
                        setEditingTemplate(selectedTemplate);
                        setSelectedTemplate(null);
                    }}
                    onDelete={(e) => {
                        handleDelete(selectedTemplate.id, e || { stopPropagation: () => { } });
                        setSelectedTemplate(null);
                    }}
                />
            )}
        </div>
    );
};

export default ProposalTemplates;
