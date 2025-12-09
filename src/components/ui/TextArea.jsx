import React from 'react';
import { cn } from '../../lib/utils';

const TextArea = React.forwardRef(({
    className,
    label,
    error,
    ...props
}, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-small font-medium text-text-primary mb-1.5">
                    {label}
                </label>
            )}
            <textarea
                className={cn(
                    "flex min-h-[80px] w-full rounded-md border border-border bg-surface px-3 py-2 text-body ring-offset-background placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-danger focus-visible:ring-danger",
                    className
                )}
                ref={ref}
                {...props}
            />
            {error && (
                <p className="mt-1 text-small text-danger">{error}</p>
            )}
        </div>
    );
});

TextArea.displayName = "TextArea";

export default TextArea;
