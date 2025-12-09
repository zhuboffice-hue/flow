import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { uploadToCloudinary } from '../../../lib/cloudinary';
import { db, storage } from '../../../lib/firebase';
import Icon from '../../ui/Icon';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Select from '../../ui/Select';

const FileCard = ({ file, onMove, onDelete, onEnterFolder, onDragStart, onDropFile }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (file.type === 'folder') {
            setIsDragOver(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (file.type === 'folder') {
            onDropFile(file.id);
        }
    };

    return (
        <div
            className={`bg-surface p-4 rounded-lg border transition-shadow cursor-pointer group relative ${isDragOver ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:shadow-sm'}`}
            onClick={() => file.type === 'folder' && onEnterFolder(file)}
            draggable
            onDragStart={(e) => onDragStart(e, file)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${file.type === 'folder' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                    <Icon name={file.type === 'folder' ? 'Folder' : 'FileText'} size={20} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {file.type !== 'folder' && (
                        <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded hover:bg-gray-100 text-text-secondary hover:text-primary block"
                            onClick={(e) => e.stopPropagation()}
                            title="View"
                        >
                            <Icon name="Eye" size={14} />
                        </a>
                    )}
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onMove(file); }} title="Move">
                        <Icon name="FolderInput" size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-danger" onClick={(e) => { e.stopPropagation(); onDelete(file.id); }} title="Delete">
                        <Icon name="Trash2" size={14} />
                    </Button>
                </div>
            </div>
            <h4 className="font-medium text-text-primary truncate mb-1" title={file.name}>{file.name}</h4>
            <div className="flex justify-between text-xs text-text-secondary">
                <span>{file.size}</span>
                <span>{new Date(file.createdAt?.seconds * 1000).toLocaleDateString()}</span>
            </div>
        </div>
    );
};

const FileRow = ({ file, onMove, onDelete, onEnterFolder, onDragStart, onDropFile }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (file.type === 'folder') {
            setIsDragOver(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (file.type === 'folder') {
            onDropFile(file.id);
        }
    };

    return (
        <div
            className={`flex items-center justify-between p-3 bg-surface border-b transition-colors cursor-pointer group ${isDragOver ? 'bg-primary/5 border-primary' : 'border-border hover:bg-background'}`}
            onClick={() => file.type === 'folder' && onEnterFolder(file)}
            draggable
            onDragStart={(e) => onDragStart(e, file)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded flex items-center justify-center ${file.type === 'folder' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                    <Icon name={file.type === 'folder' ? 'Folder' : 'FileText'} size={16} />
                </div>
                <span className="font-medium text-text-primary truncate" title={file.name}>{file.name}</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-text-secondary">
                <span className="w-20 text-right">{file.size}</span>
                <span className="w-24 text-right">{new Date(file.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity w-24 justify-end z-10">
                    {file.type !== 'folder' && (
                        <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded hover:bg-gray-100 text-text-secondary hover:text-primary"
                            onClick={(e) => e.stopPropagation()}
                            title="View"
                        >
                            <Icon name="Eye" size={14} />
                        </a>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onMove(file); }} title="Move">
                        <Icon name="FolderInput" size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-danger" onClick={(e) => { e.stopPropagation(); onDelete(file.id); }} title="Delete">
                        <Icon name="Trash2" size={14} />
                    </Button>
                </div>
            </div>
        </div>
    );
};

const ClientFiles = ({ clientId }) => {
    const [files, setFiles] = useState([]);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [currentFolder, setCurrentFolder] = useState(null); // null = root
    const [folderPath, setFolderPath] = useState([{ id: null, name: 'Root' }]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [fileToMove, setFileToMove] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [fileToUpload, setFileToUpload] = useState(null);
    const [allFolders, setAllFolders] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [draggedFileId, setDraggedFileId] = useState(null);

    useEffect(() => {
        if (!clientId) return;

        // Fetch files in current folder
        const q = query(
            collection(db, 'clients', clientId, 'files'),
            where('parentId', '==', currentFolder)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const filesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFiles(filesData);
        });

        // Fetch all folders for move functionality
        const foldersQuery = query(
            collection(db, 'clients', clientId, 'files'),
            where('type', '==', 'folder')
        );
        const foldersUnsub = onSnapshot(foldersQuery, (snapshot) => {
            const foldersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllFolders(foldersData);
        });

        return () => {
            unsubscribe();
            foldersUnsub();
        };
    }, [clientId, currentFolder]);

    const uploadFiles = async (filesToUpload) => {
        if (!filesToUpload || filesToUpload.length === 0) return;

        setUploading(true);
        // Array to execute uploads in parallel
        const uploads = Array.from(filesToUpload).map(async (file) => {
            try {
                // Upload to Cloudinary
                const downloadURL = await uploadToCloudinary(file);

                // Save metadata to Firestore
                await addDoc(collection(db, 'clients', clientId, 'files'), {
                    name: file.name,
                    type: 'file',
                    size: (file.size / 1024).toFixed(2) + ' KB',
                    url: downloadURL,
                    parentId: currentFolder,
                    createdAt: new Date()
                });
            } catch (error) {
                console.error(`Error uploading ${file.name}:`, error);
                alert(`Failed to upload ${file.name}`);
            }
        });

        await Promise.all(uploads);
        setUploading(false);
        setIsUploadModalOpen(false);
        setFileToUpload(null);
    };

    const handleUploadFormSubmit = (e) => {
        e.preventDefault();
        if (fileToUpload) {
            uploadFiles([fileToUpload]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
            uploadFiles(droppedFiles);
        }
    };

    const onDragStartItem = (e, file) => {
        setDraggedFileId(file.id);
        e.dataTransfer.effectAllowed = 'move';
        // Set data for compatibility
        e.dataTransfer.setData('text/plain', file.id);
    };

    const onDropFileOnFolder = async (targetFolderId) => {
        if (!draggedFileId) return;
        if (targetFolderId === draggedFileId) return; // Cannot drop folder into itself

        try {
            await updateDoc(doc(db, 'clients', clientId, 'files', draggedFileId), {
                parentId: targetFolderId
            });
            setDraggedFileId(null);
        } catch (error) {
            console.error("Error moving file:", error);
            alert("Failed to move file.");
        }
    };

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        try {
            await addDoc(collection(db, 'clients', clientId, 'files'), {
                name: newFolderName,
                type: 'folder',
                size: '-',
                parentId: currentFolder,
                createdAt: new Date()
            });
            setIsFolderModalOpen(false);
            setNewFolderName('');
        } catch (error) {
            console.error("Error creating folder:", error);
        }
    };

    const handleDeleteFile = async (fileId) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await deleteDoc(doc(db, 'clients', clientId, 'files', fileId));
            } catch (error) {
                console.error("Error deleting file:", error);
            }
        }
    };

    const handleMoveFile = async (e) => {
        e.preventDefault();
        // If triggered by button click, find the select element
        let targetFolderId;
        if (e.target.tagName === 'BUTTON') {
            const form = document.getElementById('moveForm');
            targetFolderId = form.folder.value === 'root' ? null : form.folder.value;
        } else {
            targetFolderId = e.target.folder.value === 'root' ? null : e.target.folder.value;
        }

        try {
            await updateDoc(doc(db, 'clients', clientId, 'files', fileToMove.id), {
                parentId: targetFolderId
            });
            setIsMoveModalOpen(false);
            setFileToMove(null);
        } catch (error) {
            console.error("Error moving file:", error);
        }
    };

    const enterFolder = (folder) => {
        setCurrentFolder(folder.id);
        setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
    };

    const navigateToBreadcrumb = (index) => {
        const newPath = folderPath.slice(0, index + 1);
        setFolderPath(newPath);
        setCurrentFolder(newPath[newPath.length - 1].id);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                    {folderPath.map((crumb, index) => (
                        <React.Fragment key={index}>
                            <span
                                className="hover:text-primary cursor-pointer hover:underline"
                                onClick={() => navigateToBreadcrumb(index)}
                            >
                                {crumb.name}
                            </span>
                            {index < folderPath.length - 1 && <Icon name="ChevronRight" size={12} />}
                        </React.Fragment>
                    ))}
                </div>
                <div className="flex gap-2">
                    <div className="flex bg-surface rounded-md border border-border p-0.5 mr-2">
                        <button
                            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                            onClick={() => setViewMode('grid')}
                            title="Grid View"
                        >
                            <Icon name="LayoutGrid" size={16} />
                        </button>
                        <button
                            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                            onClick={() => setViewMode('list')}
                            title="List View"
                        >
                            <Icon name="List" size={16} />
                        </button>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setIsFolderModalOpen(true)}>
                        <Icon name="FolderPlus" size={14} className="mr-2" /> New Folder
                    </Button>
                    <Button size="sm" onClick={() => setIsUploadModalOpen(true)}>
                        <Icon name="Upload" size={14} className="mr-2" /> Upload File
                    </Button>
                </div>
            </div>

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`transition-colors duration-200 rounded-lg ${isDragging ? 'bg-primary/5 border-2 border-dashed border-primary' : ''}`}
            >
                {uploading && (
                    <div className="text-center py-4 bg-primary/10 rounded-lg mb-4 text-primary animate-pulse">
                        Uploading files...
                    </div>
                )}

                {files.length === 0 ? (
                    <div className={`text-center py-12 text-text-secondary bg-surface rounded-lg border border-border ${isDragging ? 'border-transparent bg-transparent' : ''}`}>
                        <Icon name="FolderOpen" size={48} className="mx-auto mb-4 text-muted" />
                        <p>This folder is empty.</p>
                        <p className="text-sm mt-2 opacity-70">Drag and drop files here to upload</p>
                    </div>
                ) : (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {files.map(file => (
                                <FileCard
                                    key={file.id}
                                    file={file}
                                    onDelete={handleDeleteFile}
                                    onMove={(f) => { setFileToMove(f); setIsMoveModalOpen(true); }}
                                    onEnterFolder={enterFolder}
                                    onDragStart={onDragStartItem}
                                    onDropFile={onDropFileOnFolder}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-surface rounded-lg border border-border overflow-hidden">
                            {files.map(file => (
                                <FileRow
                                    key={file.id}
                                    file={file}
                                    onDelete={handleDeleteFile}
                                    onMove={(f) => { setFileToMove(f); setIsMoveModalOpen(true); }}
                                    onEnterFolder={enterFolder}
                                    onDragStart={onDragStartItem}
                                    onDropFile={onDropFileOnFolder}
                                />
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Upload Modal */}
            <Modal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                title="Upload File"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleUploadFormSubmit} disabled={!fileToUpload || uploading}>
                            {uploading ? 'Uploading...' : 'Upload'}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <input
                        type="file"
                        className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        onChange={(e) => setFileToUpload(e.target.files[0])}
                    />
                </div>
            </Modal>

            {/* New Folder Modal */}
            <Modal
                isOpen={isFolderModalOpen}
                onClose={() => setIsFolderModalOpen(false)}
                title="Create New Folder"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsFolderModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateFolder}>Create</Button>
                    </div>
                }
            >
                <Input
                    label="Folder Name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g., Contracts"
                    autoFocus
                />
            </Modal>

            {/* Move File Modal */}
            <Modal
                isOpen={isMoveModalOpen}
                onClose={() => setIsMoveModalOpen(false)}
                title={`Move "${fileToMove?.name}"`}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsMoveModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleMoveFile}>Move Here</Button>
                    </div>
                }
            >
                <form id="moveForm" onSubmit={handleMoveFile}>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Select Destination</label>
                    <select
                        name="folder"
                        className="w-full p-2 rounded-md border border-border bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        defaultValue={currentFolder || 'root'}
                    >
                        <option value="root">Root</option>
                        {allFolders
                            .filter(f => f.id !== fileToMove?.id) // Can't move folder into itself
                            .map(folder => (
                                <option key={folder.id} value={folder.id}>{folder.name}</option>
                            ))
                        }
                    </select>
                </form>
            </Modal>
        </div>
    );
};

export default ClientFiles;
