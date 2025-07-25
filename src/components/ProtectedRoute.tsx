
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/components/AuthProvider';
import { securityLogger } from '@/utils/securityValidation';

interface ProtectedRouteProps {
  children: ReactNode;
  module: string;
  action?: string;
}

export const ProtectedRoute = ({ children, module, action = 'view' }: ProtectedRouteProps) => {
  const { user } = useAuth();
  const { hasPermission, loading } = usePermissions();

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while checking permissions
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          Checking permissions...
        </div>
      </div>
    );
  }

  // Check if user has permission
  if (!hasPermission(module, action)) {
    // Log unauthorized access attempt
    securityLogger.logUnauthorizedAccess(module, action);
    
    return (
      <div className="flex flex-col items-center justify-center h-64 p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-sm text-gray-600 mb-4">You don't have permission to access this module.</p>
          <button 
            onClick={() => window.history.back()}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
