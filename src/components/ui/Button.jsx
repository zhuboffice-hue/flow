import React from 'react';
import { cn } from '../../lib/utils';
import Icon from './Icon';

const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95",
    secondary: "bg-surface border border-border text-text-primary hover:bg-background active:bg-gray-100",
    ghost: "bg-transparent text-text-primary hover:bg-gray-100 active:bg-gray-200",
    danger: "bg-danger text-white hover:bg-danger/90 active:bg-danger/95",
};

const sizes = {
    sm: "h-8 px-3 text-small",
    md: "h-10 px-4 text-body",
    lg: "h-12 px-6 text-body",
    icon: "h-10 w-10 p-2 flex items-center justify-center",
};

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className,
    isLoading,
    disabled,
    icon,
    iconPosition = 'left',
    ...props
}) => {
    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
                variants[variant],
                sizes[size],
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Icon name="Loader2" className="mr-2 animate-spin" size={16} />}
            {!isLoading && icon && iconPosition === 'left' && <Icon name={icon} className="mr-2" size={18} />}
            {children}
            {!isLoading && icon && iconPosition === 'right' && <Icon name={icon} className="ml-2" size={18} />}
        </button>
    );
};

export default Button;
