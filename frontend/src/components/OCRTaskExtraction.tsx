/**
 * OCR Task Extraction Component
 * Integrates image upload and OCR processing for ISP task extraction
 */

import React, { useState } from 'react';
import {
  PhotoIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import ImageUpload from './ImageUpload';
import OCRResults from './OCRResults';
import { ocrAPI } from '../services/apiService';
import toast from 'react-hot-toast';

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

interface OCRTaskExtractionProps {
  onTasksExtracted: (tasks: Array<{ description: string }>) => void;
  onAddManualTask: () => void;
  className?: string;
}

const OCRTaskExtraction: React.FC<OCRTaskExtractionProps> = ({
  onTasksExtracted,
  onAddManualTask,
  className = ''
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState<{
    tasks: OCRTask[];
    extractedText: string;
    confidence: number;
    warnings: string[];
    formSections?: any[];
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Handle image selection
  const handleImageSelect = async (file: File) => {
    setSelectedFile(file);
    setOcrResults(null);
    
    // Start processing immediately
    await processImage(file);
  };

  // Handle image removal
  const handleImageRemove = () => {
    setSelectedFile(null);
    setOcrResults(null);
  };

  // Process image with OCR
  const processImage = async (file: File) => {
    setIsProcessing(true);
    
    try {
      console.log('🔍 Starting OCR processing for file:', file.name);
      
      const result = await ocrAPI.processISPScreenshot(file);
      
      if (result.success && result.data) {
        console.log('✅ OCR processing successful:', result.data);
        
        setOcrResults({
          tasks: result.data.tasks || [],
          extractedText: result.data.extractedText || '',
          confidence: result.data.confidence || 0,
          warnings: result.data.warnings || [],
          formSections: result.data.formSections || []
        });
        
        if (result.data.tasks && result.data.tasks.length > 0) {
          toast.success(`Successfully extracted ${result.data.tasks.length} task${result.data.tasks.length !== 1 ? 's' : ''}`);
        } else {
          toast('No tasks were found in the image. You can add them manually.');
        }
      } else {
        console.error('❌ OCR processing failed:', result.error);
        toast.error(result.error || 'Failed to process image');
        
        // Still show results if we have extracted text
        if (result.extractedText) {
          setOcrResults({
            tasks: [],
            extractedText: result.extractedText,
            confidence: 0,
            warnings: result.warnings || ['OCR processing failed but text was extracted']
          });
        }
      }
    } catch (error) {
      console.error('❌ OCR processing error:', error);
      toast.error('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle tasks change from OCR results
  const handleTasksChange = (updatedTasks: OCRTask[]) => {
    if (ocrResults) {
      setOcrResults({
        ...ocrResults,
        tasks: updatedTasks
      });
    }
  };

  // Handle adding extracted tasks to the main form
  const handleAddExtractedTasks = () => {
    if (ocrResults && ocrResults.tasks.length > 0) {
      const tasksToAdd = ocrResults.tasks.map(task => ({
        description: task.description,
        structuredData: task.structuredData,
        formType: task.formType || 'isp_form',
        extractionMethod: task.source || 'ocr',
        confidence: task.confidence
      }));

      onTasksExtracted(tasksToAdd);
      toast.success(`Added ${tasksToAdd.length} task${tasksToAdd.length !== 1 ? 's' : ''} to your ISP tasks`);

      // Clear results after adding
      setOcrResults(null);
      setSelectedFile(null);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <PhotoIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Extract ISP Tasks from Screenshot
        </h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload a screenshot of your ISP task list and we'll automatically extract the tasks for you.
          You can review and edit the extracted tasks before adding them to your profile.
        </p>
      </div>

      {/* Image Upload */}
      <ImageUpload
        onImageSelect={handleImageSelect}
        onImageRemove={handleImageRemove}
        isProcessing={isProcessing}
        className="max-w-2xl mx-auto"
      />

      {/* OCR Results */}
      {ocrResults && (
        <div className="max-w-4xl mx-auto">
          <OCRResults
            tasks={ocrResults.tasks}
            extractedText={ocrResults.extractedText}
            confidence={ocrResults.confidence}
            warnings={ocrResults.warnings}
            onTasksChange={handleTasksChange}
            onAddTask={onAddManualTask}
            formSections={ocrResults.formSections}
            showStructuredView={true}
          />
          
          {/* Action Buttons */}
          {ocrResults.tasks.length > 0 && (
            <div className="mt-6 flex items-center justify-center space-x-4">
              <button
                onClick={handleAddExtractedTasks}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Add {ocrResults.tasks.length} Task{ocrResults.tasks.length !== 1 ? 's' : ''} to Profile
              </button>
              
              <button
                onClick={() => {
                  setOcrResults(null);
                  setSelectedFile(null);
                }}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual Alternative */}
      {!selectedFile && !ocrResults && (
        <div className="text-center">
          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-600 mb-4">
              Don't have a screenshot? You can also add tasks manually.
            </p>
            <button
              onClick={onAddManualTask}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Add Tasks Manually
            </button>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <div className="text-center">
              <ArrowPathIcon className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Processing Image
              </h3>
              <p className="text-gray-600">
                Extracting text and identifying ISP tasks...
              </p>
              <div className="mt-4 text-sm text-gray-500">
                This may take a few moments
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OCRTaskExtraction;
