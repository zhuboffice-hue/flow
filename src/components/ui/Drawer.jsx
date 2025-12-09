import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import Icon from './Icon';

const Drawer = ({
    isOpen,
    onClose,
    title,
    children,
    placement = 'right',
    size = 'md',
    bodyClassName
}) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const placements = {
        right: "inset-y-0 right-0 h-full border-l",
        left: "inset-y-0 left-0 h-full border-r",
        bottom: "inset-x-0 bottom-0 border-t rounded-t-xl"
    };

    const sizes = {
        sm: "w-80",
        md: "w-96",
        lg: "w-[480px]",
        xl: "w-[640px]"
    };

    return createPortal(
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div
                className="absolute inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
            />

            <div className={cn(
                "absolute bg-surface shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col",
                placements[placement],
                placement !== 'bottom' && sizes[size],
                placement === 'bottom' && "h-[80vh]"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h3 className="text-h3 font-semibold text-text-primary">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-muted hover:text-text-primary transition-colors"
                    >
                        <Icon name="X" size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className={cn("flex-1 overflow-y-auto p-6", bodyClassName)}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Drawer;
