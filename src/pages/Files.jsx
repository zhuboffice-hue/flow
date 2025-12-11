import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { uploadToCloudinary } from '../lib/cloudinary';
import ThreePaneLayout from '../components/layout/ThreePaneLayout';
import FileSidebar from '../components/files/FileSidebar';
import FileGrid from '../components/files/FileGrid';
import FileList from '../components/files/FileList';
import UploadModal from '../components/files/UploadModal';
import FilePreviewModal from '../components/files/FilePreviewModal';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

const Files = () => {
    const { currentUser } = useAuth();
    const [files, setFiles] = useState([]);
    const [viewMode, setViewMode] = useState('grid');
    const [currentFolder, setCurrentFolder] = useState(null); // null = root
    const [folderPath, setFolderPath] = useState([{ id: null, name: 'Root' }]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state

    // DnD State
    const [isDragging, setIsDragging] = useState(false);
    const [draggedFileId, setDraggedFileId] = useState(null);
    const [uploading, setUploading] = useState(false); // Added for upload feedback

    const categories = [
        { id: 'all', name: 'All Files', icon: 'Files' },
        { id: 'recent', name: 'Recent', icon: 'Clock' },
        { id: 'deliverables', name: 'Deliverables', icon: 'Star' },
        { id: 'trash', name: 'Trash', icon: 'Trash2' },
    ];

    const [allFolders, setAllFolders] = useState([]);

    // Fetch Files (current folder content)
    useEffect(() => {
        if (!currentUser?.companyId) return;
        let q = query(collection(db, 'files'), where('companyId', '==', currentUser.companyId), where('parentId', '==', currentFolder));

        // Simple category filtering (client-side for now or advanced query later)
        if (activeCategory === 'deliverables') {
            q = query(collection(db, 'files'), where('companyId', '==', currentUser.companyId), where('isDeliverable', '==', true));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedFiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFiles(fetchedFiles);
        });

        return () => unsubscribe();
    }, [currentFolder, activeCategory, currentUser]);

    // Fetch All Folders for Sidebar Tree
    useEffect(() => {
        if (!currentUser?.companyId) return;
        const q = query(collection(db, 'files'), where('companyId', '==', currentUser.companyId), where('type', '==', 'folder'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const folders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllFolders(folders);
        });
        return () => unsubscribe();
    }, [currentUser]);

    const handleFolderClick = (folder) => {
        setCurrentFolder(folder.id);
        setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
    };

    const handleBreadcrumbClick = (index) => {
        const newPath = folderPath.slice(0, index + 1);
        setFolderPath(newPath);
        setCurrentFolder(newPath[newPath.length - 1].id);
    };

    // --- Upload Logic ---
    const uploadFiles = async (filesToUpload) => {
        if (!filesToUpload || filesToUpload.length === 0) return;

        setUploading(true);
        const uploads = Array.from(filesToUpload).map(async (file) => {
            try {
                const downloadURL = await uploadToCloudinary(file);
                await addDoc(collection(db, 'files'), {
                    name: file.name,
                    type: 'file',
                    size: (file.size / 1024).toFixed(2) + ' KB',
                    url: downloadURL,
                    parentId: currentFolder,
                    companyId: currentUser.companyId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    createdBy: currentUser.uid,
                    isDeliverable: false // Default
                });
            } catch (error) {
                console.error(`Error uploading ${file.name}:`, error);
                alert(`Failed to upload ${file.name}`);
            }
        });

        await Promise.all(uploads);
        setUploading(false);
        setIsUploadModalOpen(false); // Close modal if open
    };

    // --- DnD Handlers (Container - Upload) ---
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

    // --- DnD Handlers (Item - Move) ---
    const onDragStartItem = (e, file) => {
        setDraggedFileId(file.id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', file.id);
    };

    const onDropFileOnFolder = async (targetFolderId) => {
        if (!draggedFileId) return;
        if (targetFolderId === draggedFileId) return;

        try {
            await updateDoc(doc(db, 'files', draggedFileId), {
                parentId: targetFolderId,
                updatedAt: new Date()
            });
            setDraggedFileId(null);
        } catch (error) {
            console.error("Error moving file:", error);
            alert("Failed to move file.");
        }
    };


    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            await addDoc(collection(db, 'files'), {
                name: newFolderName,
                type: 'folder',
                size: '-',
                parentId: currentFolder,
                companyId: currentUser.companyId,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: currentUser.uid
            });
            setIsNewFolderModalOpen(false);
            setNewFolderName('');
        } catch (error) {
            console.error("Error creating folder:", error);
        }
    };

    const handleDelete = async (fileId) => {
        if (window.confirm("Delete this item?")) {
            try {
                await deleteDoc(doc(db, 'files', fileId));
            } catch (error) {
                console.error("Error deleting:", error);
            }
        }
    };

    return (
        <ThreePaneLayout>
            <div className="flex h-full relative">
                {/* Mobile Drawer Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar - Responsive Drawer */}
                <div className={`
                    fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border 
                    transform transition-transform duration-200 ease-in-out
                    md:relative md:translate-x-0 md:z-0
                    ${isSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}
                `}>
                    <FileSidebar
                        currentFolder={currentFolder}
                        categories={categories}
                        activeCategory={activeCategory}
                        folders={allFolders}
                        onFolderSelect={(folder) => {
                            setActiveCategory(null);
                            handleFolderClick(folder);
                            setIsSidebarOpen(false); // Close on selection (mobile)
                        }}
                        onCategorySelect={(cat) => {
                            setActiveCategory(cat);
                            setCurrentFolder(null);
                            setFolderPath([{ id: null, name: 'Root' }]);
                            setIsSidebarOpen(false);
                        }}
                    />
                    {/* Close button for mobile */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="absolute top-4 right-4 md:hidden text-text-secondary"
                    >
                        <Icon name="X" size={20} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden w-full">
                    {/* Header / Toolbar */}
                    <div className="h-16 border-b border-border flex items-center justify-between px-4 md:px-6 bg-background">
                        <div className="flex items-center gap-2 text-sm text-text-secondary overflow-hidden">
                            {/* Mobile Sidebar Toggle */}
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="mr-2 md:hidden text-text-secondary hover:text-text-primary"
                            >
                                <Icon name="Menu" size={20} />
                            </button>

                            <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
                                {folderPath.map((crumb, index) => (
                                    <React.Fragment key={index}>
                                        <span
                                            className="hover:text-primary cursor-pointer hover:underline font-medium"
                                            onClick={() => handleBreadcrumbClick(index)}
                                        >
                                            {crumb.name}
                                        </span>
                                        {index < folderPath.length - 1 && <Icon name="ChevronRight" size={14} />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="flex bg-surface rounded-md border border-border p-0.5 hidden sm:flex">
                                <button
                                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                                    onClick={() => setViewMode('grid')}
                                >
                                    <Icon name="LayoutGrid" size={18} />
                                </button>
                                <button
                                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                                    onClick={() => setViewMode('list')}
                                >
                                    <Icon name="List" size={18} />
                                </button>
                            </div>
                            <Button variant="secondary" size="sm" onClick={() => setIsNewFolderModalOpen(true)} className="whitespace-nowrap">
                                <Icon name="FolderPlus" size={16} className="mr-0 md:mr-2" />
                                <span className="hidden md:inline">New Folder</span>
                            </Button>
                            <Button size="sm" onClick={() => setIsUploadModalOpen(true)} className="whitespace-nowrap">
                                <Icon name="Upload" size={16} className="mr-0 md:mr-2" />
                                <span className="hidden md:inline">Upload</span>
                            </Button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div
                        className={`flex-1 overflow-y-auto bg-surface-secondary/30 transition-colors duration-200 ${isDragging ? 'bg-primary/5 border-2 border-dashed border-primary m-4 rounded-lg' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {uploading && (
                            <div className="text-center py-4 bg-primary/10 mx-4 mt-4 rounded-lg text-primary animate-pulse border border-primary/20">
                                Uploading files...
                            </div>
                        )}

                        {files.length === 0 ? (
                            <div className={`flex flex-col items-center justify-center h-full text-text-secondary ${isDragging ? 'opacity-50' : ''}`}>
                                <Icon name="FolderOpen" size={64} className="mb-4 text-gray-300" />
                                <p className="text-lg font-medium">This folder is empty</p>
                                <p className="text-sm">Upload files or create a new folder to get started</p>
                                <p className="text-xs mt-2 opacity-70">Drag and drop files here to upload</p>
                            </div>
                        ) : (
                            viewMode === 'grid' ? (
                                <FileGrid
                                    files={files}
                                    onFileClick={(f) => { setSelectedFile(f); setIsPreviewModalOpen(true); }}
                                    onFolderClick={handleFolderClick}
                                    onDelete={handleDelete}
                                    onMove={() => { }} // TODO: Implement Move Modal later if needed
                                    onDragStart={onDragStartItem}
                                    onDropFile={onDropFileOnFolder}
                                />
                            ) : (
                                <FileList
                                    files={files}
                                    onFileClick={(f) => { setSelectedFile(f); setIsPreviewModalOpen(true); }}
                                    onFolderClick={handleFolderClick}
                                    onDelete={handleDelete}
                                    onMove={() => { }}
                                    onDragStart={onDragStartItem}
                                    onDropFile={onDropFileOnFolder}
                                />
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                currentFolder={currentFolder}
            />

            <FilePreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                file={selectedFile}
            />

            <Modal
                isOpen={isNewFolderModalOpen}
                onClose={() => setIsNewFolderModalOpen(false)}
                title="Create New Folder"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsNewFolderModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateFolder}>Create</Button>
                    </div>
                }
            >
                <Input
                    label="Folder Name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g. Designs"
                    autoFocus
                />
            </Modal>
        </ThreePaneLayout>
    );
};

export default Files;
