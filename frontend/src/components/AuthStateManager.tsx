import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';

interface AuthStateManagerProps {
  children: React.ReactNode;
}

/**
 * AuthStateManager - Handles smooth auth state transitions and prevents UI flicker
 * This component ensures that auth state is properly initialized before rendering children
 */
const AuthStateManager: React.FC<AuthStateManagerProps> = ({ children }) => {
  const { isLoading, isAuthenticated, user, initialize } = useAuthStore();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('🔄 AuthStateManager: Initializing auth state...');
        await initialize();
        setHasInitialized(true);
        console.log('✅ AuthStateManager: Auth state initialized', {
          isAuthenticated,
          hasUser: !!user,
          userPreferences: user?.preferences
        });
      } catch (error) {
        console.error('❌ AuthStateManager: Auth initialization failed:', error);
        setHasInitialized(true); // Still mark as initialized to prevent infinite loading
      }
    };

    if (!hasInitialized) {
      initAuth();
    }
  }, [initialize, hasInitialized, isAuthenticated, user]);

  // Show loading state until auth is properly initialized
  if (!hasInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing SwiftNotes...</p>
          <p className="text-xs text-gray-500 mt-2">
            {!hasInitialized ? 'Setting up authentication...' : 'Loading user data...'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthStateManager;
