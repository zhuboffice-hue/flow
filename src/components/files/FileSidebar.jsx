import React from 'react';
import Icon from '../ui/Icon';
import { cn } from '../../lib/utils';

const FileSidebar = ({ currentFolder, onFolderSelect, categories, onCategorySelect, activeCategory, folders = [] }) => {

    const FolderItem = ({ folder, level = 0 }) => {
        const children = folders.filter(f => f.parentId === folder.id);
        const isActive = currentFolder === folder.id;

        return (
            <div className="select-none">
                <button
                    onClick={() => onFolderSelect(folder)}
                    className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors mb-0.5",
                        isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                    )}
                    style={{ paddingLeft: `${level * 12 + 8}px` }}
                >
                    <Icon name={children.length > 0 ? "FolderOpen" : "Folder"} size={16} className={isActive ? "text-primary" : "text-muted"} />
                    <span className="truncate">{folder.name}</span>
                </button>
                {children.length > 0 && (
                    <div>
                        {children.map(child => (
                            <FolderItem key={child.id} folder={child} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const rootFolders = folders.filter(f => !f.parentId);

    return (
        <div className="w-64 border-r border-border bg-surface h-full flex flex-col">
            <div className="p-4">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Library</h3>
                <nav className="space-y-1">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => onCategorySelect(cat.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                activeCategory === cat.id
                                    ? "bg-primary/10 text-primary"
                                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                            )}
                        >
                            <Icon name={cat.icon} size={18} />
                            {cat.name}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="p-4 border-t border-border flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Folders</h3>
                </div>

                <div className="space-y-0.5">
                    {rootFolders.length === 0 ? (
                        <div className="text-sm text-text-secondary italic px-2">No folders yet</div>
                    ) : (
                        rootFolders.map(folder => (
                            <FolderItem key={folder.id} folder={folder} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default FileSidebar;
