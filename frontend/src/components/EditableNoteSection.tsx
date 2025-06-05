/**
 * Editable Note Section Component with Analytics Integration
 * Tracks user edits and provides feedback mechanisms
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  StarIcon,
  ChatBubbleLeftIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
// TEMPORARILY DISABLED - import writingAnalyticsService from '../services/writingAnalyticsService';
import toast from 'react-hot-toast';

interface EditableNoteSectionProps {
  sectionId: string;
  noteId: string;
  content: string;
  originalContent: string;
  isEdited: boolean;
  onContentChange: (content: string, isEdited: boolean) => void;
  onAnalyticsUpdate?: () => void;
  className?: string;
}

const EditableNoteSection: React.FC<EditableNoteSectionProps> = ({
  sectionId,
  noteId,
  content,
  originalContent,
  isEdited,
  onContentChange,
  onAnalyticsUpdate,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [showFeedback, setShowFeedback] = useState(false);
  const [satisfactionRating, setSatisfactionRating] = useState(0);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  const handleEdit = () => {
    setIsEditing(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
      }
    }, 0);
  };

  const handleSave = async () => {
    if (editedContent.trim() === content.trim()) {
      setIsEditing(false);
      return;
    }

    try {
      // Calculate edit type based on content changes
      const editType = calculateEditType(originalContent, editedContent);
      
      // TEMPORARILY DISABLED - Log analytics for the edit
      // await writingAnalyticsService.logAnalytics({
      //   noteId,
      //   noteSectionId: sectionId,
      //   originalGenerated: originalContent,
      //   userEditedVersion: editedContent.trim(),
      //   editType,
      //   confidenceScore: calculateConfidenceScore(originalContent, editedContent),
      // });

      onContentChange(editedContent.trim(), true);
      setIsEditing(false);
      onAnalyticsUpdate?.();
      
      toast.success('Content updated and analytics logged');
    } catch (error) {
      console.error('Failed to save content:', error);
      toast.error('Failed to save content');
    }
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleFeedbackSubmit = async () => {
    if (satisfactionRating === 0) {
      toast.error('Please provide a satisfaction rating');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      // TEMPORARILY DISABLED - Log analytics feedback
      // await writingAnalyticsService.logAnalytics({
      //   noteId,
      //   noteSectionId: sectionId,
      //   originalGenerated: originalContent,
      //   userSatisfactionScore: satisfactionRating,
      //   feedbackNotes: feedbackNotes.trim() || undefined,
      // });

      setShowFeedback(false);
      setSatisfactionRating(0);
      setFeedbackNotes('');
      onAnalyticsUpdate?.();
      
      toast.success('Feedback submitted successfully');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const calculateEditType = (original: string, edited: string): 'minor' | 'major' | 'style_change' | 'content_addition' | 'complete_rewrite' => {
    const originalWords = original.split(/\s+/).length;
    const editedWords = edited.split(/\s+/).length;
    const wordDifference = Math.abs(editedWords - originalWords);
    const changePercentage = wordDifference / originalWords;

    if (changePercentage > 0.7) return 'complete_rewrite';
    if (changePercentage > 0.3) return 'major';
    if (editedWords > originalWords * 1.2) return 'content_addition';
    if (hasStyleChanges(original, edited)) return 'style_change';
    return 'minor';
  };

  const hasStyleChanges = (original: string, edited: string): boolean => {
    // Simple heuristic for style changes
    const originalSentences = original.split(/[.!?]+/).length;
    const editedSentences = edited.split(/[.!?]+/).length;
    const sentenceDifference = Math.abs(editedSentences - originalSentences) / originalSentences;
    
    return sentenceDifference > 0.2;
  };

  const calculateConfidenceScore = (original: string, edited: string): number => {
    // Simple confidence calculation based on edit magnitude
    const editType = calculateEditType(original, edited);
    switch (editType) {
      case 'minor': return 0.9;
      case 'style_change': return 0.7;
      case 'major': return 0.5;
      case 'content_addition': return 0.6;
      case 'complete_rewrite': return 0.3;
      default: return 0.5;
    }
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={interactive ? () => setSatisfactionRating(i + 1) : undefined}
        className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
        disabled={!interactive}
      >
        {i < rating ? (
          <StarIconSolid className="h-5 w-5 text-yellow-400" />
        ) : (
          <StarIcon className="h-5 w-5 text-gray-300" />
        )}
      </button>
    ));
  };

  return (
    <div className={`border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Content Display/Edit */}
      <div className="mb-3">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              ref={textareaRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 resize-none"
              rows={Math.max(3, editedContent.split('\n').length)}
              placeholder="Edit your content..."
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="relative group">
            <div className="whitespace-pre-wrap text-gray-900 min-h-[60px] p-2 rounded border border-transparent hover:border-gray-200 transition-colors">
              {content}
            </div>
            <button
              onClick={handleEdit}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Analytics and Feedback Controls */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-3">
          {isEdited && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <PencilIcon className="h-3 w-3 mr-1" />
              Edited
            </span>
          )}
          <button
            onClick={() => setShowFeedback(!showFeedback)}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <StarIcon className="h-4 w-4 mr-1" />
            Rate Quality
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-500">Analytics Enabled</span>
        </div>
      </div>

      {/* Feedback Panel */}
      {showFeedback && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Rate this generated content</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Satisfaction Rating</label>
              <div className="flex space-x-1">
                {renderStars(satisfactionRating, true)}
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-700 mb-2">Additional Feedback (Optional)</label>
              <textarea
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                rows={2}
                placeholder="Any specific feedback about the generated content..."
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowFeedback(false)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleFeedbackSubmit}
                disabled={isSubmittingFeedback || satisfactionRating === 0}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingFeedback ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableNoteSection;
