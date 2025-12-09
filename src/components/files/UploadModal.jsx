import React, { useState } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { addDoc, collection } from 'firebase/firestore';
import { db, storage } from '../../lib/firebase';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

const UploadModal = ({ isOpen, onClose, currentFolder, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            // Upload to Cloudinary
            const downloadURL = await uploadToCloudinary(file);

            // Save metadata to Firestore
            await addDoc(collection(db, 'files'), {
                name: file.name,
                type: 'file',
                size: (file.size / 1024).toFixed(2) + ' KB',
                url: downloadURL,
                parentId: currentFolder,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'current-user', // Should use actual auth user
                version: 1,
                versions: []
            });

            if (onSuccess) onSuccess();
            onClose();
            setFile(null);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload file");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Upload File"
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleUpload} disabled={!file || uploading}>
                        {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                </div>
            }
        >
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-surface transition-colors">
                <input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    onChange={(e) => setFile(e.target.files[0])}
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <Icon name="UploadCloud" size={32} className="text-primary" />
                    <span className="text-sm font-medium text-text-primary">
                        {file ? file.name : "Click to select a file"}
                    </span>
                    <span className="text-xs text-text-secondary">
                        {file ? `${(file.size / 1024).toFixed(2)} KB` : "SVG, PNG, JPG or PDF"}
                    </span>
                </label>
            </div>
        </Modal>
    );
};

export default UploadModal;
