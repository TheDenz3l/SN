import { useState, useEffect, useRef } from 'react';

interface UsePreferencesStateProps {
  savedToneLevel: number;
  savedDetailLevel: 'brief' | 'moderate' | 'detailed' | 'comprehensive';
  isSaving: boolean;
}

interface UsePreferencesStateReturn {
  defaultToneLevel: number;
  defaultDetailLevel: 'brief' | 'moderate' | 'detailed' | 'comprehensive';
  setDefaultToneLevel: (value: number) => void;
  setDefaultDetailLevel: (value: 'brief' | 'moderate' | 'detailed' | 'comprehensive') => void;
  hasUnsavedChanges: boolean;
  resetToSaved: () => void;
}

/**
 * Custom hook to manage preferences state without UI glitches
 * Uses completely isolated state that only syncs on initial load
 */
export const usePreferencesState = ({
  savedToneLevel,
  savedDetailLevel,
  isSaving
}: UsePreferencesStateProps): UsePreferencesStateReturn => {
  const [defaultToneLevel, setDefaultToneLevel] = useState(savedToneLevel);
  const [defaultDetailLevel, setDefaultDetailLevel] = useState(savedDetailLevel);

  // Track if this is the initial load
  const isInitialized = useRef(false);

  // Track if user has made any changes
  const hasUserChanges = useRef(false);

  // Calculate unsaved changes directly
  const hasUnsavedChanges = defaultToneLevel !== savedToneLevel || defaultDetailLevel !== savedDetailLevel;

  // ONLY sync on initial load - never during saves or user interactions
  useEffect(() => {
    if (!isInitialized.current) {
      setDefaultToneLevel(savedToneLevel);
      setDefaultDetailLevel(savedDetailLevel);
      isInitialized.current = true;
    }
  }, [savedToneLevel, savedDetailLevel]);

  // Custom setters that mark user changes
  const handleSetToneLevel = (value: number) => {
    hasUserChanges.current = true;
    setDefaultToneLevel(value);
  };

  const handleSetDetailLevel = (value: 'brief' | 'moderate' | 'detailed' | 'comprehensive') => {
    hasUserChanges.current = true;
    setDefaultDetailLevel(value);
  };

  const resetToSaved = () => {
    hasUserChanges.current = false;
    setDefaultToneLevel(savedToneLevel);
    setDefaultDetailLevel(savedDetailLevel);
  };

  return {
    defaultToneLevel,
    defaultDetailLevel,
    setDefaultToneLevel: handleSetToneLevel,
    setDefaultDetailLevel: handleSetDetailLevel,
    hasUnsavedChanges,
    resetToSaved
  };
};
