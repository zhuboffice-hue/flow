import React from 'react';
import { cn } from '../../lib/utils';
import Icon from './Icon';

const Select = React.forwardRef(({
    className,
    label,
    error,
    options = [],
    placeholder = "Select an option",
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
                <select
                    className={cn(
                        "flex h-10 w-full appearance-none rounded-md border border-border bg-surface px-3 py-2 text-body ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-danger focus-visible:ring-danger",
                        className
                    )}
                    ref={ref}
                    {...props}
                >
                    <option value="" disabled>{placeholder}</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                    <Icon name="ChevronDown" size={16} />
                </div>
            </div>
            {error && (
                <p className="mt-1 text-small text-danger">{error}</p>
            )}
        </div>
    );
});

Select.displayName = "Select";

export default Select;
