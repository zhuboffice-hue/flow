import React from 'react';
import { cn } from '../../lib/utils';
import Icon from './Icon';

const Input = React.forwardRef(({
    className,
    type = "text",
    label,
    error,
    icon,
    ...props
}, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-small font-medium text-text-primary mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                        <Icon name={icon} size={18} />
                    </div>
                )}
                <input
                    type={type}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-body ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
                        icon && "pl-10",
                        error && "border-danger focus-visible:ring-danger",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-small text-danger">{error}</p>
            )}
        </div>
    );
});

Input.displayName = "Input";

export default Input;
