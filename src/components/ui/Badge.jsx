import React from 'react';
import { cn } from '../../lib/utils';

const variants = {
    default: "bg-primary/10 text-primary hover:bg-primary/20",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    success: "bg-success/10 text-success hover:bg-success/20",
    warning: "bg-warning/10 text-warning hover:bg-warning/20",
    danger: "bg-danger/10 text-danger hover:bg-danger/20",
    outline: "text-text-primary border border-border",
};

const Badge = ({ className, variant = "default", children, ...props }) => {
    return (
        <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent", variants[variant], className)} {...props}>
            {children}
        </div>
    );
};

export default Badge;
