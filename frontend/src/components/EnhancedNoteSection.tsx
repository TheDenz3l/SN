/**
 * Enhanced Note Section Component with Preview and Detail Level Controls
 * Provides advanced AI content generation with style preservation
 */

import React, { useState, useEffect } from 'react';
import {
  EyeIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { aiAPI } from '../services/apiService';
import { useAuthStore } from '../stores/authStore';
import AutoResizeTextarea from './AutoResizeTextarea';
import toast from 'react-hot-toast';

interface EnhancedNoteSectionProps {
  index: number;
  section: {
    prompt: string;
    type: 'task' | 'comment' | 'general';
    taskId?: string;
    generated?: string;
    isEdited?: boolean;
    sectionId?: string;
    originalGenerated?: string;
  };
  taskDescription?: string;
  onPromptChange: (prompt: string) => void;
  onRemove?: () => void;
  className?: string;
}

interface PreviewData {
  originalPrompt: string;
  enhancedContent: string;
  detailLevel: string;
  toneLevel?: number;
  isBasicPreview?: boolean;
  metrics: {
    tokensUsed: number;
    estimatedCost: number;
    generationTimeMs: number;
    styleMatchScore: number;
    expansionRatio: number;
  };
}

const DETAIL_LEVELS = [
  { value: 'brief', label: 'Brief', description: 'Concise, essential details only' },
  { value: 'moderate', label: 'Moderate', description: 'Balanced detail level' },
  { value: 'detailed', label: 'Detailed', description: 'Comprehensive with context' },
  { value: 'comprehensive', label: 'Comprehensive', description: 'Maximum detail and elaboration' }
] as const;

const EnhancedNoteSection: React.FC<EnhancedNoteSectionProps> = ({
  index,
  section,
  taskDescription,
  onPromptChange,
  onRemove,
  className = ''
}) => {
  const { user } = useAuthStore();
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [detailLevel, setDetailLevel] = useState<'brief' | 'moderate' | 'detailed' | 'comprehensive'>('brief');
  const [toneLevel, setToneLevel] = useState<number>(50); // 0 = Most Authentic, 100 = Most Professional
  const [showSettings, setShowSettings] = useState(false);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize with user's default preferences
  useEffect(() => {
    if (user?.preferences) {
      const defaultTone = user.preferences.defaultToneLevel ?? 50;
      const defaultDetail = user.preferences.defaultDetailLevel ?? 'brief';

      // Always update with fresh preferences on user change
      setToneLevel(defaultTone);
      setDetailLevel(defaultDetail);
      setIsInitialized(true);
    }
  }, [user?.preferences]);

  const generatePreview = async () => {
    if (!section.prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }

    try {
      setIsGeneratingPreview(true);

      const result = await aiAPI.generatePreview({
        prompt: section.prompt.trim(),
        taskDescription,
        detailLevel,
        toneLevel
      });

      if (result.success && result.preview) {
        setPreviewData(result.preview);
        setShowPreview(true);
      } else {
        // Handle specific error cases
        if (result.error && result.error.includes('complete your setup')) {
          toast.error('Please complete your setup first to use preview functionality', {
            duration: 5000,
            action: {
              label: 'Go to Setup',
              onClick: () => window.location.href = '/setup'
            }
          });
        } else {
          toast.error(result.error || 'Failed to generate preview');
        }
      }
    } catch (error) {
      console.error('Preview generation error:', error);

      // Check if it's a setup-related error
      if (error instanceof Error && error.message.includes('setup')) {
        toast.error('Please complete your setup first to use preview functionality', {
          duration: 5000,
          action: {
            label: 'Go to Setup',
            onClick: () => window.location.href = '/setup'
          }
        });
      } else {
        toast.error('Failed to generate preview');
      }
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const formatISPTaskTitle = (description: string) => {
    // Clean up the description and apply formatting
    let formatted = description.trim();

    // Add proper spacing after common patterns
    formatted = formatted
      // Add space after colons if missing
      .replace(/([a-zA-Z]):([a-zA-Z])/g, '$1: $2')
      // Add space after periods followed by numbers (e.g., "1.The" -> "1. The")
      .replace(/(\d)\.([A-Z])/g, '$1. $2')
      // Add space after commas if missing
      .replace(/,([a-zA-Z])/g, ', $1')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      // Ensure proper spacing around common separators
      .replace(/\s*-\s*/g, ' - ')
      .replace(/\s*:\s*/g, ': ')
      .replace(/\s*;\s*/g, '; ')
      // Add space after "Goal:" if missing
      .replace(/Goal:([A-Z])/g, 'Goal: $1')
      // Fix common ISP patterns
      .replace(/(\d)\.\s*([A-Z])/g, '$1. $2')
      // Ensure proper capitalization after periods
      .replace(/\.\s*([a-z])/g, (match, letter) => `. ${letter.toUpperCase()}`)
      // Clean up "Describe:" patterns
      .replace(/Describe:\s*/g, 'Describe: ')
      // Fix treatment/response patterns
      .replace(/Active Treatment:\s*/g, 'Active Treatment: ')
      .replace(/Individual Response:\s*/g, 'Individual Response: ');

    return formatted;
  };

  const getSectionTitle = () => {
    if (section.type === 'task' && taskDescription) {
      const formattedDescription = formatISPTaskTitle(taskDescription);
      const maxLength = 100; // Increased for better readability

      if (formattedDescription.length <= maxLength || isTitleExpanded) {
        return formattedDescription;
      }

      // Find a good break point (prefer after punctuation)
      const truncateAt = formattedDescription.substring(0, maxLength).lastIndexOf('. ');
      const breakPoint = truncateAt > 60 ? truncateAt + 1 : maxLength;

      return `${formattedDescription.substring(0, breakPoint)}...`;
    }
    if (section.type === 'comment') {
      return 'General Comment Section';
    }
    return 'Custom Section';
  };

  const shouldShowExpandButton = () => {
    if (section.type === 'task' && taskDescription) {
      const formattedDescription = formatISPTaskTitle(taskDescription);
      return formattedDescription.length > 100;
    }
    return false;
  };

  const getDetailLevelColor = (level: string) => {
    switch (level) {
      case 'brief': return 'text-blue-600 bg-blue-50';
      case 'moderate': return 'text-green-600 bg-green-50';
      case 'detailed': return 'text-purple-600 bg-purple-50';
      case 'comprehensive': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={`border border-gray-200 rounded-lg p-4 ${className}`}>
      <style jsx>{`
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
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {section.type === 'task' ? (
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <span className="isp-task-badge mt-0.5">
                  ISP TASK
                </span>
                {shouldShowExpandButton() && (
                  <button
                    onClick={() => setIsTitleExpanded(!isTitleExpanded)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5"
                    title={isTitleExpanded ? "Show less" : "Show full title"}
                  >
                    {isTitleExpanded ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
              <div className="mt-2">
                <h3 className="isp-task-title break-words">
                  {getSectionTitle()}
                </h3>
              </div>
            </div>
          ) : (
            <h3 className="text-sm font-medium text-gray-900 break-words leading-relaxed">
              {getSectionTitle()}
            </h3>
          )}
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDetailLevelColor(detailLevel)}`}>
            {detailLevel}
          </span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Detail Level Settings"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
          </button>
          {section.type !== 'task' && onRemove && (
            <button
              onClick={onRemove}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Detail Level Settings */}
      {showSettings && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Detail Level</h4>
            <div className="grid grid-cols-2 gap-2">
              {DETAIL_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setDetailLevel(level.value)}
                  className={`p-2 text-left rounded-md border transition-colors ${
                    detailLevel === level.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-sm">{level.label}</div>
                  <div className="text-xs text-gray-500">{level.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tone Level Slider */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Writing Tone</h4>
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
                  onChange={(e) => setToneLevel(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${toneLevel}%, #E5E7EB ${toneLevel}%, #E5E7EB 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span className="font-medium text-gray-700">{toneLevel}</span>
                  <span>100</span>
                </div>
              </div>
              <div className="text-xs text-gray-600 text-center">
                {toneLevel < 25 && "Personal writing style with natural expressions"}
                {toneLevel >= 25 && toneLevel < 50 && "Balanced tone with some personal touch"}
                {toneLevel >= 50 && toneLevel < 75 && "Professional with clinical standards"}
                {toneLevel >= 75 && "Formal clinical documentation style"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Prompt
          </label>
          <AutoResizeTextarea
            value={section.prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            minRows={3}
            maxRows={8}
            placeholder="Describe what you want to include in this section..."
          />
          <div className="mt-1 text-xs text-gray-500">
            {section.prompt?.length || 0} characters
          </div>
        </div>

        {/* Preview Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={generatePreview}
            disabled={isGeneratingPreview || !section.prompt.trim()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPreview ? (
              <>
                <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                Generating...
              </>
            ) : (
              <>
                <EyeIcon className="h-4 w-4 mr-2" />
                Preview Enhanced
              </>
            )}
          </button>
          
          {previewData && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center px-3 py-2 text-sm text-primary-600 hover:text-primary-800"
            >
              <SparklesIcon className="h-4 w-4 mr-1" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </button>
          )}
        </div>

        {/* Preview Display */}
        {showPreview && previewData && (
          <div className="border border-primary-200 rounded-lg p-4 bg-primary-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-primary-900">Enhanced Content Preview</h4>
                {previewData.isBasicPreview && (
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    Basic Preview
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4 text-xs text-primary-700">
                <div className="flex items-center">
                  <ChartBarIcon className="h-3 w-3 mr-1" />
                  Style Match: {previewData.metrics.styleMatchScore}%
                </div>
                <div className="flex items-center">
                  <SparklesIcon className="h-3 w-3 mr-1" />
                  {previewData.metrics.expansionRatio}x expansion
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  {previewData.metrics.generationTimeMs}ms
                </div>
                {previewData.toneLevel !== undefined && (
                  <div className="flex items-center">
                    <AdjustmentsHorizontalIcon className="h-3 w-3 mr-1" />
                    Tone: {previewData.toneLevel}/100
                  </div>
                )}
              </div>
            </div>

            {previewData.isBasicPreview && (
              <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                <strong>Note:</strong> This is a basic preview using a default writing style.
                Complete your setup to get personalized content that matches your writing style.
              </div>
            )}

            <div className="bg-white rounded-md p-3 border border-primary-200">
              <div className="whitespace-pre-wrap text-gray-900 text-sm">
                {previewData.enhancedContent}
              </div>
            </div>

            <div className="mt-3 text-xs text-primary-600">
              <strong>Original:</strong> "{previewData.originalPrompt}"
            </div>
          </div>
        )}

        {/* Generated Content Display */}
        {section.generated && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Generated Content
            </label>
            <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
              <div className="whitespace-pre-wrap text-gray-900 text-sm">
                {section.generated}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedNoteSection;
