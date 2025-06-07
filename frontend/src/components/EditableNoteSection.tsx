/**
 * Editable Note Section Component
 * Allows users to edit generated note content
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface EditableNoteSectionProps {
  content: string;
  isEdited: boolean;
  onContentChange: (content: string, isEdited: boolean) => void;
  className?: string;
}

const EditableNoteSection: React.FC<EditableNoteSectionProps> = ({
  content,
  isEdited,
  onContentChange,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
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
      onContentChange(editedContent.trim(), true);
      setIsEditing(false);

      toast.success('Content updated successfully');
    } catch (error) {
      console.error('Failed to save content:', error);
      toast.error('Failed to save content');
    }
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Content copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy content:', error);
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = content;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success('Content copied to clipboard!');
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        toast.error('Failed to copy content');
      }
    }
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
            <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title="Copy content"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleEdit}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title="Edit content"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Display */}
      {isEdited && (
        <div className="flex items-center pt-3 border-t border-gray-100">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <PencilIcon className="h-3 w-3 mr-1" />
            Edited
          </span>
        </div>
      )}
    </div>
  );
};

export default EditableNoteSection;
