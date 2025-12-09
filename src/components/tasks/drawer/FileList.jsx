import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ref, deleteObject, getDownloadURL } from 'firebase/storage';
import { uploadToCloudinary } from '../../../lib/cloudinary';
import { db, storage } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../ui/Button';
import Icon from '../../ui/Icon';

const FileList = ({ taskId, projectId }) => {
    const { currentUser } = useAuth();
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!taskId || !projectId) return;

        const q = query(collection(db, 'projects', projectId, 'tasks', taskId, 'files'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setFiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [taskId, projectId]);

    const handleFileSelect = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setUploading(true);
        try {
            // Upload to Cloudinary
            const downloadURL = await uploadToCloudinary(selectedFile);

            // Save metadata to Firestore
            await addDoc(collection(db, 'projects', projectId, 'tasks', taskId, 'files'), {
                name: selectedFile.name,
                url: downloadURL,
                type: selectedFile.type,
                size: selectedFile.size,
                uploadedBy: currentUser.uid,
                uploadedByName: currentUser.displayName || currentUser.email,
                createdAt: new Date()
            });

        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Failed to upload file. Please try again.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (file) => {
        if (!window.confirm(`Are you sure you want to delete ${file.name}?`)) return;

        try {
            // 1. Delete from Storage
            if (file.storagePath) {
                const storageRef = ref(storage, file.storagePath);
                await deleteObject(storageRef);
            }

            // 2. Delete from Firestore
            await deleteDoc(doc(db, 'projects', projectId, 'tasks', taskId, 'files', file.id));

        } catch (error) {
            console.error("Error deleting file:", error);
            alert("Failed to delete file.");
        }
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-medium text-text-primary">Files</h3>
                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        <Icon name={uploading ? "Loader2" : "Upload"} size={14} className={`mr-2 ${uploading ? "animate-spin" : ""}`} />
                        {uploading ? "Uploading..." : "Upload File"}
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                {files.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary border-2 border-dashed border-border rounded-lg">
                        <Icon name="FileText" size={24} className="mx-auto mb-2 opacity-50" />
                        <p>No files attached.</p>
                    </div>
                ) : (
                    files.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-surface border border-border rounded-md hover:bg-surface-secondary transition-colors group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-primary/10 rounded text-primary">
                                    <Icon name="File" size={20} />
                                </div>
                                <div className="min-w-0">
                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-text-primary hover:underline truncate block">
                                        {file.name}
                                    </a>
                                    <div className="text-xs text-muted flex items-center gap-2">
                                        <span>{formatSize(file.size)}</span>
                                        <span>•</span>
                                        <span>{file.uploadedByName}</span>
                                        <span>•</span>
                                        <span>{file.createdAt?.toDate().toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(file)} className="text-muted hover:text-danger p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Icon name="Trash2" size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FileList;
