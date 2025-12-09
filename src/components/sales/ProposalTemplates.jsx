import React, { useState, useEffect } from 'react';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import CreateTemplateModal from './CreateTemplateModal';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const ProposalTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'proposalTemplates'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTemplates(data);
        });
        return () => unsubscribe();
    }, []);

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
                    <div key={template.id} className="bg-surface p-6 rounded-lg border border-border hover:shadow-md transition-shadow cursor-pointer group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-md bg-primary/10 text-primary">
                                <Icon name="FileText" size={24} />
                            </div>
                            <button className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-primary transition-opacity">
                                <Icon name="MoreVertical" size={20} />
                            </button>
                        </div>
                        <h3 className="font-bold text-lg text-text-primary mb-2">{template.name}</h3>
                        <p className="text-sm text-text-secondary mb-4">{template.type}</p>
                        <div className="flex justify-between items-center text-xs text-text-secondary border-t border-border pt-4">
                            <span>Last used: {formatDate(template.lastUsed)}</span>
                            <button className="text-primary hover:underline">Edit</button>
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

            {isCreateModalOpen && (
                <CreateTemplateModal onClose={() => setIsCreateModalOpen(false)} />
            )}
        </div>
    );
};

export default ProposalTemplates;
