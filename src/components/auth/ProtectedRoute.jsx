import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, module }) => {
    const { currentUser } = useAuth();
    const location = useLocation();

    if (!currentUser) {
        // Should be handled by parent auth guard, but safe fallback
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Admins have access to everything
    if (currentUser.role === 'Admin' || currentUser.role === 'SuperAdmin') {
        return children;
    }

    // If no module specified, allow access (e.g. dashboard)
    if (!module) {
        return children;
    }

    // Check permissions
    if (currentUser.allowedModules && !currentUser.allowedModules.includes(module)) {
        // Redirect to dashboard or unauthorized page
        return <Navigate to="/app" replace />;
    }

    return children;
};

export default ProtectedRoute;
