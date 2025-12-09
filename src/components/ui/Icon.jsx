import React from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '../../lib/utils';

const Icon = ({ name, className, size = 20, ...props }) => {
    const LucideIcon = LucideIcons[name];

    if (!LucideIcon) {
        console.warn(`Icon "${name}" not found in lucide-react`);
        return null;
    }

    return <LucideIcon className={cn("inline-block", className)} size={size} {...props} />;
};

export default Icon;
