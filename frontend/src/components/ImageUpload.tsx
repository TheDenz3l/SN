/**
 * Image Upload Component for OCR Processing
 * Handles file selection, validation, and upload for ISP screenshot processing
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  CloudArrowUpIcon,
  PhotoIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  isProcessing?: boolean;
  disabled?: boolean;
  maxSizeBytes?: number;
  acceptedFormats?: string[];
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  onImageRemove,
  isProcessing = false,
  disabled = false,
  maxSizeBytes = 10 * 1024 * 1024, // 10MB default
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff'],
  className = ''
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Validate file
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return {
        isValid: false,
        error: `Invalid file type. Accepted formats: ${acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}`
      };
    }

    // Check file size
    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `File size too large. Maximum size: ${formatFileSize(maxSizeBytes)}`
      };
    }

    return { isValid: true };
  };

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const validation = validateFile(file);
    
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Notify parent component
    onImageSelect(file);
    
    toast.success('Image selected successfully');
  }, [onImageSelect, maxSizeBytes, acceptedFormats]);

  // Handle file input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle file removal
  const handleRemove = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageRemove();
    toast.success('Image removed');
  };

  // Handle click to select file
  const handleClick = () => {
    if (!disabled && !isProcessing) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {!selectedFile && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragOver 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled || isProcessing 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-gray-50'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleInputChange}
            disabled={disabled || isProcessing}
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="mx-auto h-12 w-12 text-gray-400">
              {isProcessing ? (
                <ArrowPathIcon className="animate-spin" />
              ) : (
                <CloudArrowUpIcon />
              )}
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isProcessing ? 'Processing...' : 'Upload ISP Screenshot'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Drag and drop your ISP task screenshot here, or click to select
              </p>
            </div>
            
            <div className="text-xs text-gray-500">
              <p>Supported formats: {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}</p>
              <p>Maximum size: {formatFileSize(maxSizeBytes)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Area */}
      {selectedFile && previewUrl && (
        <div className="space-y-4">
          <div className="relative bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-4">
              {/* Image Preview */}
              <div className="flex-shrink-0">
                <img
                  src={previewUrl}
                  alt="ISP Screenshot Preview"
                  className="h-24 w-24 object-cover rounded-lg border border-gray-200"
                />
              </div>
              
              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type.split('/')[1].toUpperCase()}
                    </p>
                    <div className="flex items-center mt-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-xs text-green-600">Ready for processing</span>
                    </div>
                  </div>
                  
                  {/* Remove Button */}
                  {!isProcessing && (
                    <button
                      onClick={handleRemove}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Remove image"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <ArrowPathIcon className="h-8 w-8 text-primary-600 animate-spin mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Processing image...</p>
                  <p className="text-xs text-gray-600">This may take a few moments</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <PhotoIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Tips for better OCR results:
            </h3>
            <ul className="mt-2 text-sm text-blue-700 space-y-1">
              <li>• Ensure the image is clear and well-lit</li>
              <li>• Make sure text is not blurry or distorted</li>
              <li>• Higher resolution images work better</li>
              <li>• Avoid images with complex backgrounds</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
