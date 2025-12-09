import React from 'react';
import { cn } from '../../lib/utils';
import Icon from './Icon';

const Checkbox = React.forwardRef(({ className, label, ...props }, ref) => {
    return (
        <label className="flex items-center space-x-2 cursor-pointer">
            <input
                type="checkbox"
                className={cn(
                    "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 checked:bg-primary checked:text-primary-foreground",
                    className
                )}
                ref={ref}
                {...props}
            />
            {label && (
                <span className="text-small font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                </span>
            )}
        </label>
    );
});

Checkbox.displayName = "Checkbox";

export default Checkbox;
