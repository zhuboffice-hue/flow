import React from 'react';
import Icon from '../ui/Icon';
import Button from '../ui/Button';

const FileGrid = ({ files, onFileClick, onFolderClick, onDelete, onMove, onDragStart, onDropFile }) => {

    // Internal state handling for drag over effects within items
    const [dragOverId, setDragOverId] = React.useState(null);

    const handleDragOver = (e, file) => {
        e.preventDefault();
        e.stopPropagation();
        if (file.type === 'folder') {
            setDragOverId(file.id);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverId(null);
    };

    const handleDrop = (e, file) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverId(null);
        if (file.type === 'folder') {
            onDropFile(file.id);
        }
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
            {files.map(file => (
                <div
                    key={file.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, file)}
                    onDragOver={(e) => handleDragOver(e, file)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, file)}
                    className={`bg-surface p-4 rounded-lg border transition-shadow cursor-pointer group relative ${dragOverId === file.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:shadow-sm'}`}
                    onClick={() => file.type === 'folder' ? onFolderClick(file) : onFileClick(file)}
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${file.type === 'folder' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                            <Icon name={file.type === 'folder' ? 'Folder' : 'FileText'} size={20} />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            {file.type !== 'folder' && (
                                <button
                                    className="p-1 rounded bg-surface hover:bg-gray-100 text-text-secondary hover:text-primary border border-border h-6 w-6 flex items-center justify-center"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(file.url, '_blank', 'noreferrer');
                                    }}
                                    title="View"
                                >
                                    <Icon name="Eye" size={14} />
                                </button>
                            )}
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onMove(file); }}>
                                <Icon name="FolderInput" size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-danger" onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}>
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
            ))}
        </div>
    );
};

export default FileGrid;
