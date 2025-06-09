/**
 * OCR Results Component
 * Displays OCR processing results with extracted tasks and editing capabilities
 */

import React, { useState } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import AutoResizeTextarea from './AutoResizeTextarea';
import { Badge } from './ui';

interface OCRTask {
  description: string;
  confidence: number;
  source: string;
  validated?: boolean;
  originalDescription?: string;
  structuredData?: {
    goal: string;
    activeTreatment: string;
    individualResponse: string;
    scoresComments: string;
    type: string;
  };
  formType?: string;
  extractionMethod?: string;
}

interface OCRResultsProps {
  tasks: OCRTask[];
  extractedText: string;
  confidence: number;
  warnings: string[];
  onTasksChange: (tasks: OCRTask[]) => void;
  onAddTask: () => void;
  className?: string;
  formSections?: any[];
  showStructuredView?: boolean;
}

const OCRResults: React.FC<OCRResultsProps> = ({
  tasks,
  extractedText,
  confidence,
  warnings,
  onTasksChange,
  onAddTask,
  className = ''
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [editedTasks, setEditedTasks] = useState<OCRTask[]>(tasks);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'simple' | 'structured'>('simple');

  // Update edited tasks when props change
  React.useEffect(() => {
    setEditedTasks(tasks);
  }, [tasks]);

  // Handle task description change
  const handleTaskChange = (index: number, newDescription: string) => {
    const updatedTasks = [...editedTasks];
    updatedTasks[index] = {
      ...updatedTasks[index],
      description: newDescription
    };
    setEditedTasks(updatedTasks);
    onTasksChange(updatedTasks);
  };

  // Handle structured data change (currently unused but kept for future functionality)
  // const handleStructuredDataChange = (index: number, field: string, value: string) => {
  //   const updatedTasks = [...editedTasks];
  //   updatedTasks[index] = {
  //     ...updatedTasks[index],
  //     structuredData: {
  //       goal: '',
  //       activeTreatment: '',
  //       individualResponse: '',
  //       scoresComments: '',
  //       type: '',
  //       ...updatedTasks[index].structuredData,
  //       [field]: value
  //     }
  //   };
  //   setEditedTasks(updatedTasks);
  //   onTasksChange(updatedTasks);
  // };

  // Toggle task expansion
  const toggleTaskExpansion = (index: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedTasks(newExpanded);
  };

  // Handle task removal
  const handleRemoveTask = (index: number) => {
    const updatedTasks = editedTasks.filter((_, i) => i !== index);
    setEditedTasks(updatedTasks);
    onTasksChange(updatedTasks);
  };

  // Start editing a task
  const startEditing = (index: number) => {
    setEditingIndex(index);
  };

  // Stop editing
  const stopEditing = () => {
    setEditingIndex(null);
  };

  // Get confidence variant
  const getConfidenceVariant = (conf: number) => {
    if (conf >= 80) return 'success';
    if (conf >= 60) return 'warning';
    return 'error';
  };

  // Get confidence label
  const getConfidenceLabel = (conf: number) => {
    if (conf >= 80) return 'High';
    if (conf >= 60) return 'Medium';
    return 'Low';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Overall Confidence */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            OCR Processing Results
          </h3>
          <div className="flex items-center space-x-4">
            <Badge
              variant={getConfidenceVariant(confidence)}
              style="subtle"
              size="md"
            >
              {getConfidenceLabel(confidence)} Confidence ({confidence}%)
            </Badge>
            <div className="text-sm text-gray-600">
              {editedTasks.length} task{editedTasks.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-yellow-800">
                  Please review the following:
                </h4>
                <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Extracted Text Toggle */}
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={() => setShowExtractedText(!showExtractedText)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {showExtractedText ? (
              <EyeSlashIcon className="h-4 w-4 mr-2" />
            ) : (
              <EyeIcon className="h-4 w-4 mr-2" />
            )}
            {showExtractedText ? 'Hide' : 'Show'} extracted text
          </button>
          
          {showExtractedText && (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center mb-2">
                <DocumentTextIcon className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Raw extracted text:</span>
              </div>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                {extractedText || 'No text extracted'}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Extracted Tasks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-900">
            Extracted ISP Tasks
          </h4>
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            {editedTasks.some(task => task.structuredData) && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">View:</span>
                <button
                  onClick={() => setViewMode(viewMode === 'simple' ? 'structured' : 'simple')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    viewMode === 'structured'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {viewMode === 'simple' ? 'Show Details' : 'Simple View'}
                </button>
              </div>
            )}
            <button
              onClick={onAddTask}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Task
            </button>
          </div>
        </div>

        {editedTasks.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No tasks were extracted from the image.</p>
            <p className="text-sm text-gray-500 mt-1">
              You can add tasks manually using the "Add Task" button above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {editedTasks.map((task, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <DocumentTextIcon className="h-5 w-5 text-primary-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {editingIndex === index ? (
                      <div className="space-y-3">
                        <AutoResizeTextarea
                          value={task.description}
                          onChange={(e) => handleTaskChange(index, e.target.value)}
                          placeholder="Enter task description..."
                          className="w-full"
                          minRows={2}
                        />
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={stopEditing}
                            className="px-3 py-1 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 transition-colors"
                          >
                            Done
                          </button>
                          <button
                            onClick={() => handleRemoveTask(index)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-900 leading-relaxed">
                          {task.description}
                        </p>

                        {/* Structured Data Display */}
                        {viewMode === 'structured' && task.structuredData && (
                          <div className="mt-4 space-y-3 bg-gray-50 rounded-lg p-3">
                            <h5 className="text-sm font-medium text-gray-700">Form Details:</h5>

                            {task.structuredData.goal && (
                              <div>
                                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Goal:</label>
                                <p className="text-sm text-gray-800 mt-1">{task.structuredData.goal}</p>
                              </div>
                            )}

                            {task.structuredData.activeTreatment && (
                              <div>
                                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Active Treatment:</label>
                                <p className="text-sm text-gray-800 mt-1">{task.structuredData.activeTreatment}</p>
                              </div>
                            )}

                            {task.structuredData.individualResponse && (
                              <div>
                                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Individual Response:</label>
                                <p className="text-sm text-gray-800 mt-1">{task.structuredData.individualResponse}</p>
                              </div>
                            )}

                            {task.structuredData.scoresComments && (
                              <div>
                                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Scores/Comments:</label>
                                <p className="text-sm text-gray-800 mt-1">{task.structuredData.scoresComments}</p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-3">
                            <Badge
                              variant={getConfidenceVariant(task.confidence)}
                              style="subtle"
                              size="sm"
                            >
                              {task.confidence}% confidence
                            </Badge>
                            {task.originalDescription && (
                              <span className="text-xs text-gray-500">
                                (Auto-corrected)
                              </span>
                            )}
                            {task.structuredData && (
                              <Badge
                                variant="info"
                                style="subtle"
                                size="sm"
                              >
                                Structured
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            {task.structuredData && (
                              <button
                                onClick={() => toggleTaskExpansion(index)}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                title={expandedTasks.has(index) ? "Collapse details" : "Expand details"}
                              >
                                <ChartBarIcon className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => startEditing(index)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Edit task"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveTask(index)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Remove task"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {editedTasks.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-green-800">
                Ready to proceed
              </h4>
              <p className="text-sm text-green-700 mt-1">
                {editedTasks.length} task{editedTasks.length !== 1 ? 's' : ''} extracted and ready to be added to your ISP tasks.
                You can edit any task above before proceeding.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OCRResults;
