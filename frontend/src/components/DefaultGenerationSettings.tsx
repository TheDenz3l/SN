import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { userAPI } from '../services/apiService';
import { Button, Badge } from './ui';
import type { User } from '../stores/authStore';

interface DefaultGenerationSettingsProps {
  user: User | null;
  updateUser: (updates: Partial<User>) => Promise<void>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

type DetailLevel = 'brief' | 'moderate' | 'detailed' | 'comprehensive';

/**
 * BULLETPROOF Default Generation Settings Component
 * COMPLETELY ISOLATED STATE - No reactive updates from props
 */
const DefaultGenerationSettings: React.FC<DefaultGenerationSettingsProps> = memo(({
  user,
  updateUser,
  isLoading,
  setIsLoading
}) => {
  // SIMPLE, PERFORMANCE-OPTIMIZED STATE MANAGEMENT
  const [toneLevel, setToneLevel] = useState<number>(50);
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('brief');
  const [useTimePatterns, setUseTimePatterns] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Track the last saved values to calculate unsaved changes
  const lastSavedValues = useRef({
    toneLevel: 50,
    detailLevel: 'brief' as DetailLevel,
    useTimePatterns: true
  });

  // Track user interactions and saving state
  const hasUserInteracted = useRef(false);
  const isSaving = useRef(false);

  // Track user ID to detect when user changes (login/logout)
  const lastUserIdRef = useRef<string | null>(null);

  // FIXED: Proper initialization that handles preference updates after login
  useEffect(() => {
    if (user?.preferences && !isSaving.current) {
      const currentUserId = user.id;
      const userChanged = lastUserIdRef.current !== currentUserId;

      // Reset initialization if user changed (login/logout)
      if (userChanged) {
        setIsInitialized(false);
        hasUserInteracted.current = false;
        lastUserIdRef.current = currentUserId;
        console.log('🔄 User changed, resetting DefaultGenerationSettings initialization');
      }

      const initialTone = user.preferences.defaultToneLevel ?? 50;
      const initialDetail = user.preferences.defaultDetailLevel ?? 'brief';
      const initialTimePatterns = user.preferences.useTimePatterns ?? true;

      // Check if preferences have actually changed
      const preferencesChanged =
        lastSavedValues.current.toneLevel !== initialTone ||
        lastSavedValues.current.detailLevel !== initialDetail ||
        lastSavedValues.current.useTimePatterns !== initialTimePatterns;

      // Update if:
      // 1. First initialization (!isInitialized)
      // 2. User changed (fresh login)
      // 3. Preferences changed AND user hasn't made local changes
      const shouldUpdate = !isInitialized ||
                          userChanged ||
                          (preferencesChanged && !hasUserInteracted.current);

      if (shouldUpdate) {
        console.log('🔄 Initializing DefaultGenerationSettings:', {
          tone: initialTone,
          detail: initialDetail,
          timePatterns: initialTimePatterns,
          reason: !isInitialized ? 'first-init' :
                  userChanged ? 'user-changed' : 'preferences-updated'
        });

        setToneLevel(initialTone);
        setDetailLevel(initialDetail);
        setUseTimePatterns(initialTimePatterns);
        lastSavedValues.current = {
          toneLevel: initialTone,
          detailLevel: initialDetail,
          useTimePatterns: initialTimePatterns
        };
        setIsInitialized(true);
        hasUserInteracted.current = false;
      }
    }
  }, [user?.id, user?.preferences, isInitialized]); // Watch for user changes and preference changes

  // Calculate unsaved changes against last saved values
  const hasUnsavedChanges = toneLevel !== lastSavedValues.current.toneLevel ||
                           detailLevel !== lastSavedValues.current.detailLevel ||
                           useTimePatterns !== lastSavedValues.current.useTimePatterns;
  
  // BULLETPROOF HANDLERS - Mark user interaction and prevent external overrides
  const handleToneChange = useCallback((newValue: number) => {
    if (isSaving.current) {
      return;
    }

    hasUserInteracted.current = true;
    setToneLevel(newValue);
  }, []);

  const handleDetailChange = useCallback((newValue: DetailLevel) => {
    if (isSaving.current) {
      return;
    }

    hasUserInteracted.current = true;
    setDetailLevel(newValue);
  }, []);

  const handleTimePatternChange = useCallback((newValue: boolean) => {
    if (isSaving.current) {
      return;
    }

    hasUserInteracted.current = true;
    setUseTimePatterns(newValue);
  }, []);
  
  // BULLETPROOF SAVE OPERATION - No external state interference
  const savePreferences = useCallback(async () => {
    if (!hasUnsavedChanges) {
      toast('No changes to save');
      return;
    }



    setIsLoading(true);
    isSaving.current = true;

    // Capture current values to prevent any race conditions
    const savingToneLevel = toneLevel;
    const savingDetailLevel = detailLevel;
    const savingTimePatterns = useTimePatterns;

    try {
      // 1. Save to API first
      const result = await userAPI.updatePreferences({
        defaultToneLevel: savingToneLevel,
        defaultDetailLevel: savingDetailLevel,
        useTimePatterns: savingTimePatterns,
      });

      if (result.success) {
        // 2. Update our saved values to match what we just saved
        lastSavedValues.current = {
          toneLevel: savingToneLevel,
          detailLevel: savingDetailLevel,
          useTimePatterns: savingTimePatterns
        };

        // 3. Reset user interaction flag since we've saved
        hasUserInteracted.current = false;

        // 4. Update user state to ensure global state consistency
        await updateUser({
          ...user,
          preferences: {
            ...user?.preferences,
            defaultToneLevel: savingToneLevel,
            defaultDetailLevel: savingDetailLevel,
            useTimePatterns: savingTimePatterns,
          }
        }).catch(err => {
          console.warn('User state update failed, but API save succeeded:', err);
          // Don't show error to user since the API save succeeded
        });

        // Preferences saved successfully (logging removed for performance)

        toast.success('Preferences saved successfully');
      } else {
        toast.error(result.error || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Save preferences error:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsLoading(false);
      isSaving.current = false;
    }
  }, [hasUnsavedChanges, toneLevel, detailLevel, useTimePatterns, user, updateUser, setIsLoading]);
  
  // Reset to saved values
  const resetToSaved = useCallback(() => {
    hasUserInteracted.current = false;
    setToneLevel(lastSavedValues.current.toneLevel);
    setDetailLevel(lastSavedValues.current.detailLevel);
    setUseTimePatterns(lastSavedValues.current.useTimePatterns);
  }, []);
  
  // Get tone description with smooth transitions
  const getToneDescription = (level: number): string => {
    if (level <= 10) return "Maximum authenticity - pure personal style";
    if (level <= 25) return "High authenticity with natural expressions";
    if (level <= 40) return "Authentic style with professional touch";
    if (level <= 60) return "Balanced blend of personal and professional";
    if (level <= 75) return "Professional focus with authentic elements";
    if (level <= 90) return "High professional standards with subtle personal touch";
    return "Maximum professional clinical documentation";
  };
  
  // Detail level options
  const detailOptions: Array<{ value: DetailLevel; label: string; description: string }> = [
    { value: 'brief', label: 'Brief', description: 'Concise notes' },
    { value: 'moderate', label: 'Moderate', description: 'Balanced detail' },
    { value: 'detailed', label: 'Detailed', description: 'Comprehensive' },
    { value: 'comprehensive', label: 'Comprehensive', description: 'Maximum detail' },
  ];
  
  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Default Generation Settings</h3>
      
      <div className="space-y-6">
        {/* Tone Level Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Tone Level
          </label>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>More Authentic</span>
              <span>More Professional</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={toneLevel}
                onChange={(e) => handleToneChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${toneLevel}%, #E5E7EB ${toneLevel}%, #E5E7EB 100%)`
                }}
                disabled={isSaving.current}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span className="font-medium text-gray-700">{toneLevel}</span>
                <span>100</span>
              </div>
            </div>
            <div className="text-xs text-gray-600 text-center">
              {getToneDescription(toneLevel)}
            </div>
          </div>
        </div>
        
        {/* Detail Level Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Detail Level
          </label>
          <div className="grid grid-cols-2 gap-2">
            {detailOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleDetailChange(option.value)}
                disabled={isSaving.current}
                className={`p-3 text-left rounded-md border transition-colors disabled:opacity-50 ${
                  detailLevel === option.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-gray-500">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Time Pattern Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time-Based Narrative
          </label>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-700">Use Time Patterns</div>
              <div className="text-xs text-gray-500">
                Include time markers (like "6:00AM", "7:30AM") in generated content when detected in your writing style
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={useTimePatterns}
                onChange={(e) => handleTimePatternChange(e.target.checked)}
                disabled={isSaving.current}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 disabled:opacity-50"></div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          {hasUnsavedChanges && (
            <Badge
              variant="warning"
              style="subtle"
              size="sm"
              icon={<ExclamationTriangleIcon className="h-3 w-3" />}
            >
              You have unsaved changes
            </Badge>
          )}
          <div className="flex-1"></div>
          <div className="flex space-x-3">
            {hasUnsavedChanges && (
              <Button
                variant="outline"
                size="md"
                onClick={resetToSaved}
                disabled={isLoading}
              >
                Reset
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              onClick={savePreferences}
              disabled={isLoading || !hasUnsavedChanges}
              isLoading={isLoading}
            >
              {hasUnsavedChanges ? 'Save Preferences' : 'No Changes'}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Custom CSS for slider */}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
});

export default DefaultGenerationSettings;
