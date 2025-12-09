import React from 'react';
import Icon from '../ui/Icon';
import Button from '../ui/Button';

const FileList = ({ files, onFileClick, onFolderClick, onDelete, onMove, onDragStart, onDropFile }) => {

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
        <div className="bg-surface rounded-lg border border-border overflow-hidden m-4">
            <table className="w-full text-left text-sm">
                <thead className="bg-surface-secondary border-b border-border text-text-secondary font-medium">
                    <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3 w-32">Size</th>
                        <th className="px-4 py-3 w-40">Updated</th>
                        <th className="px-4 py-3 w-32 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {files.map(file => (
                        <tr
                            key={file.id}
                            draggable
                            onDragStart={(e) => onDragStart(e, file)}
                            onDragOver={(e) => handleDragOver(e, file)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, file)}
                            className={`transition-colors cursor-pointer group ${dragOverId === file.id ? 'bg-primary/5' : 'hover:bg-background'}`}
                            onClick={() => file.type === 'folder' ? onFolderClick(file) : onFileClick(file)}
                        >
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded flex items-center justify-center ${file.type === 'folder' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                                        <Icon name={file.type === 'folder' ? 'Folder' : 'FileText'} size={16} />
                                    </div>
                                    <span className="font-medium text-text-primary truncate max-w-xs" title={file.name}>{file.name}</span>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-text-secondary">{file.size}</td>
                            <td className="px-4 py-3 text-text-secondary">{new Date(file.createdAt?.seconds * 1000).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {file.type !== 'folder' && (
                                        <button
                                            className="p-1 rounded bg-surface hover:bg-gray-100 text-text-secondary hover:text-primary border border-border h-8 w-8 flex items-center justify-center"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(file.url, '_blank', 'noreferrer');
                                            }}
                                            title="View"
                                        >
                                            <Icon name="Eye" size={14} />
                                        </button>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onMove(file); }}>
                                        <Icon name="FolderInput" size={14} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-danger" onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}>
                                        <Icon name="Trash2" size={14} />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default FileList;
