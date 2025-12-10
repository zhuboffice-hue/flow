import React from 'react';
import Icon from '../ui/Icon';
import Button from '../ui/Button';

const ViewTemplateModal = ({ template, onClose, onEdit, onDelete }) => {
    if (!template) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl border border-border">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <Icon name="FileText" size={20} className="text-primary" />
                        {template.name}
                    </h2>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={onEdit} className="text-text-secondary hover:text-primary">
                            <Icon name="Edit" size={18} />
                        </Button>
                        <Button variant="ghost" onClick={onDelete} className="text-text-secondary hover:text-danger">
                            <Icon name="Trash2" size={18} />
                        </Button>
                        <button onClick={onClose} className="text-text-secondary hover:text-text-primary ml-2">
                            <Icon name="X" size={24} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Meta Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-surface-secondary/30 p-3 rounded-md border border-border">
                            <span className="text-xs text-text-secondary uppercase font-semibold">Type</span>
                            <p className="font-medium text-text-primary mt-1">{template.type}</p>
                        </div>
                        <div className="bg-surface-secondary/30 p-3 rounded-md border border-border">
                            <span className="text-xs text-text-secondary uppercase font-semibold">Last Used</span>
                            <p className="font-medium text-text-primary mt-1">
                                {template.lastUsed?.seconds
                                    ? new Date(template.lastUsed.seconds * 1000).toLocaleDateString()
                                    : 'Never'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <h3 className="text-sm font-bold text-text-primary mb-2">Default Content</h3>
                        <div className="bg-background p-4 rounded-md border border-border text-text-secondary whitespace-pre-wrap min-h-[100px]">
                            {template.content || <em className="text-text-tertiary">No content defined.</em>}
                        </div>
                    </div>

                    {/* Attachment */}
                    {template.attachment && (
                        <div>
                            <h3 className="text-sm font-bold text-text-primary mb-2">Attachment</h3>
                            <a
                                href={template.attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-md hover:bg-primary/10 transition-colors group"
                            >
                                <div className="p-2 bg-primary/20 rounded text-primary">
                                    <Icon name="File" size={20} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-medium text-text-primary truncate">{template.attachment.name}</p>
                                    <p className="text-xs text-text-secondary">{template.attachment.size}</p>
                                </div>
                                <Icon name="ExternalLink" size={18} className="text-text-secondary group-hover:text-primary" />
                            </a>
                            <p className="text-xs text-text-secondary mt-1 ml-1">
                                *Click to open. Right-click › "Save link as..." to download manually.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border flex justify-end">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

export default ViewTemplateModal;
