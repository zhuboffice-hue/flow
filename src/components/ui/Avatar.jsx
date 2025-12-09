import React from 'react';
import { cn } from '../../lib/utils';

const sizes = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
};

const Avatar = ({ src, alt, fallback, size = "md", className }) => {
    return (
        <div className={cn("relative flex shrink-0 overflow-hidden rounded-full bg-muted", sizes[size], className)}>
            {src ? (
                <img className="aspect-square h-full w-full object-cover" src={src} alt={alt} />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-text-secondary font-medium">
                    {fallback || alt?.charAt(0).toUpperCase() || "?"}
                </div>
            )}
        </div>
    );
};

export default Avatar;
