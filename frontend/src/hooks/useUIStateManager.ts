import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';

interface UIStateManagerOptions {
  enableDebugLogging?: boolean;
  syncWithAuth?: boolean;
}

interface UIStateManagerReturn {
  isInitialized: boolean;
  hasStaleData: boolean;
  forceRefresh: () => void;
  markAsStale: () => void;
  markAsInitialized: () => void;
}

/**
 * Custom hook to manage UI state synchronization and prevent common edge cases
 * Helps prevent issues like stale data after login/logout, race conditions, etc.
 */
export const useUIStateManager = (
  componentName: string,
  options: UIStateManagerOptions = {}
): UIStateManagerReturn => {
  const { enableDebugLogging = false, syncWithAuth = true } = options;
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasStaleData, setHasStaleData] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const lastUserRef = useRef(user);
  const lastAuthStateRef = useRef(isAuthenticated);

  // Track auth state changes - FIXED: Removed dependencies causing infinite loops
  useEffect(() => {
    if (!syncWithAuth) return;

    const userChanged = lastUserRef.current?.id !== user?.id;
    const authStateChanged = lastAuthStateRef.current !== isAuthenticated;

    if (userChanged || authStateChanged) {
      if (enableDebugLogging) {
        console.log(`🔄 [${componentName}] Auth state changed`, {
          userChanged,
          authStateChanged,
          oldUserId: lastUserRef.current?.id,
          newUserId: user?.id
        });
      }

      setHasStaleData(true);
      setIsInitialized(false);

      lastUserRef.current = user;
      lastAuthStateRef.current = isAuthenticated;
    }
  }, [user?.id, isAuthenticated, syncWithAuth, enableDebugLogging, componentName]); // FIXED: Only depend on stable values

  // Handle loading state changes - FIXED: Removed problematic log dependency
  useEffect(() => {
    if (!isLoading && !isInitialized && isAuthenticated && enableDebugLogging) {
      console.log(`🔄 [${componentName}] Auth loading completed, ready for initialization`);
    }
  }, [isLoading, isInitialized, isAuthenticated, enableDebugLogging, componentName]);

  const forceRefresh = useCallback(() => {
    if (enableDebugLogging) {
      console.log(`🔄 [${componentName}] Force refresh triggered`);
    }
    setRefreshCounter(prev => prev + 1);
    setHasStaleData(true);
    setIsInitialized(false);
  }, [enableDebugLogging, componentName]);

  const markAsStale = useCallback(() => {
    if (enableDebugLogging) {
      console.log(`🔄 [${componentName}] Marked as stale`);
    }
    setHasStaleData(true);
  }, [enableDebugLogging, componentName]);

  const markAsInitialized = useCallback(() => {
    if (enableDebugLogging) {
      console.log(`🔄 [${componentName}] Marked as initialized`);
    }
    setIsInitialized(true);
    setHasStaleData(false);
  }, [enableDebugLogging, componentName]);

  return {
    isInitialized,
    hasStaleData,
    forceRefresh,
    markAsStale,
    markAsInitialized,
  };
};

/**
 * Hook specifically for components that depend on user preferences
 * FIXED: Removed infinite loop and excessive JSON.stringify operations
 */
export const usePreferencesSync = (componentName: string, enableDebugLogging = false) => {
  const { user } = useAuthStore();
  const lastPreferencesRef = useRef<any>(null);
  const [hasPreferencesChanged, setHasPreferencesChanged] = useState(false);

  // FIXED: Use useEffect with proper dependency to avoid infinite loops
  useEffect(() => {
    const currentPreferences = user?.preferences;

    // Only check for changes if we have preferences
    if (currentPreferences) {
      const hasChanged = JSON.stringify(lastPreferencesRef.current) !== JSON.stringify(currentPreferences);

      if (hasChanged) {
        if (enableDebugLogging) {
          console.log(`🔄 [${componentName}] Preferences changed`);
        }
        lastPreferencesRef.current = currentPreferences;
        setHasPreferencesChanged(true);

        // Reset the flag after a short delay to prevent continuous triggering
        setTimeout(() => setHasPreferencesChanged(false), 100);
      }
    }
  }, [user?.preferences, componentName, enableDebugLogging]);

  return {
    hasPreferencesChanged,
    currentPreferences: user?.preferences,
  };
};

/**
 * Hook to detect and handle page refresh scenarios
 */
export const usePageRefreshDetection = () => {
  const [isPageRefresh, setIsPageRefresh] = useState(false);
  
  useEffect(() => {
    // Check if this is a page refresh by looking at navigation type
    const isRefresh = performance.navigation?.type === 1 || 
                     performance.getEntriesByType('navigation')[0]?.type === 'reload';
    
    if (isRefresh) {
      console.log('🔄 Page refresh detected');
      setIsPageRefresh(true);
      
      // Reset after a short delay
      setTimeout(() => setIsPageRefresh(false), 1000);
    }
  }, []);
  
  return isPageRefresh;
};
