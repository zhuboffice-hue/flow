import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

const FilePreviewModal = ({ isOpen, onClose, file }) => {
    if (!file) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={file.name}
            maxWidth="4xl"
        >
            <div className="flex flex-col md:flex-row gap-6 h-[60vh]">
                {/* Preview Area */}
                <div className="flex-1 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-border">
                    {file.type === 'folder' ? (
                        <div className="text-center text-gray-400">
                            <Icon name="Folder" size={64} className="mx-auto mb-2" />
                            <p>Folder Preview Not Available</p>
                        </div>
                    ) : (
                        file.url && file.url !== '#' ? (
                            <iframe src={file.url} className="w-full h-full" title="Preview" />
                        ) : (
                            <div className="text-center text-gray-400">
                                <Icon name="FileText" size={64} className="mx-auto mb-2" />
                                <p>Preview Not Available</p>
                            </div>
                        )
                    )}
                </div>

                {/* Sidebar Details */}
                <div className="w-full md:w-80 flex flex-col gap-4 overflow-y-auto">
                    <div className="bg-surface p-4 rounded-lg border border-border">
                        <h4 className="font-semibold text-sm mb-3">Details</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-text-secondary">Size</span>
                                <span className="font-medium">{file.size}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-secondary">Type</span>
                                <span className="font-medium uppercase">{file.name.split('.').pop()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-secondary">Uploaded</span>
                                <span className="font-medium">{new Date(file.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-secondary">Version</span>
                                <span className="font-medium">v{file.version || 1}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface p-4 rounded-lg border border-border flex-1">
                        <h4 className="font-semibold text-sm mb-3">Actions</h4>
                        <div className="space-y-2">
                            <Button variant="secondary" className="w-full justify-start">
                                <Icon name="Download" size={16} className="mr-2" /> Download
                            </Button>
                            <Button variant="secondary" className="w-full justify-start">
                                <Icon name="Share2" size={16} className="mr-2" /> Share
                            </Button>
                            <Button variant="secondary" className="w-full justify-start">
                                <Icon name="History" size={16} className="mr-2" /> Version History
                            </Button>
                            <Button variant="danger" className="w-full justify-start">
                                <Icon name="Trash2" size={16} className="mr-2" /> Delete
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default FilePreviewModal;
