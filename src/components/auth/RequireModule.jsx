import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RequireModule = ({ module, children }) => {
    const { currentUser } = useAuth();

    // Admins have access to everything
    if (currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin') {
        return children;
    }

    // Check if module is allowed
    // Note: If allowedModules is undefined, we default to ALLOW ALL to avoid breaking existing users.
    // Ideally this should be DENY ALL, but for migration safety we use ALLOW.
    // Or we can check if allowedModules exists -> strict mode.
    if (currentUser?.allowedModules && !currentUser.allowedModules.includes(module)) {
        return <Navigate to="/app" replace />;
    }

    return children;
};

export default RequireModule;
