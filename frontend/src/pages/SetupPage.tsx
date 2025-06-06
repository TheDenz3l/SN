import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CheckIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  InformationCircleIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/authStore';
import { completeSetup, checkDatabaseStatus, type SetupData } from '../services/setupService';
import DatabaseSetup from '../components/DatabaseSetup';
import AutoResizeTextarea from '../components/AutoResizeTextarea';
import OCRTaskExtraction from '../components/OCRTaskExtraction';
import toast from 'react-hot-toast';

// Local interface definition to avoid import issues
interface StyleAnalysis {
  quality: 'excellent' | 'good' | 'fair' | 'needs_improvement';
  score: number;
  suggestions: string[];
  strengths: string[];
  weaknesses: string[];
}

const setupSchema = z.object({
  writingStyle: z.string()
    .min(100, 'Writing style sample must be at least 100 characters')
    .max(3000, 'Writing style sample cannot exceed 3000 characters'),
  ispTasks: z.array(z.object({
    id: z.string(),
    description: z.string()
      .min(5, 'Task description must be at least 5 characters')
      .max(500, 'Task description cannot exceed 500 characters'),
  })).min(1, 'At least one ISP task is required'),
});

type SetupFormData = z.infer<typeof setupSchema>;

const SetupPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0); // Start with database setup
  const [isLoading, setIsLoading] = useState(false);
  const [styleAnalysis, setStyleAnalysis] = useState<StyleAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showOCRExtraction, setShowOCRExtraction] = useState(false);
  const navigate = useNavigate();
  const { updateUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    mode: 'onSubmit', // Only validate on submit, not on change
    defaultValues: {
      writingStyle: '',
      ispTasks: [{ id: '1', description: '' }],
    },
  });

  const watchedWritingStyle = watch('writingStyle');
  const watchedIspTasks = watch('ispTasks');

  const steps = [
    {
      id: 0,
      number: 1,
      name: 'Database Setup',
      description: 'Initialize your database',
      completed: currentStep > 0,
    },
    {
      id: 1,
      number: 2,
      name: 'Writing Style',
      description: 'Provide a sample of your writing style',
      completed: currentStep > 1,
    },
    {
      id: 2,
      number: 3,
      name: 'ISP Tasks',
      description: 'Add your common ISP tasks',
      completed: currentStep > 2,
    },
    {
      id: 3,
      number: 4,
      name: 'Complete',
      description: 'Finish setup and start generating notes',
      completed: false,
    },
  ];

  const addIspTask = () => {
    const currentTasks = getValues('ispTasks');
    const newTask = { id: Date.now().toString(), description: '' };
    setValue('ispTasks', [...currentTasks, newTask]);
  };

  const removeIspTask = (taskId: string) => {
    const currentTasks = getValues('ispTasks');
    if (currentTasks.length > 1) {
      setValue('ispTasks', currentTasks.filter(task => task.id !== taskId));
    }
  };

  // Handle OCR extracted tasks
  const handleOCRTasksExtracted = (extractedTasks: Array<{ description: string }>) => {
    const currentTasks = getValues('ispTasks');
    const newTasks = extractedTasks.map(task => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      description: task.description
    }));

    // If we only have empty tasks, replace them; otherwise append
    const hasValidTasks = currentTasks.some(task => task.description.trim());
    if (!hasValidTasks) {
      setValue('ispTasks', newTasks);
    } else {
      setValue('ispTasks', [...currentTasks, ...newTasks]);
    }

    setShowOCRExtraction(false);
    toast.success(`Added ${newTasks.length} task${newTasks.length !== 1 ? 's' : ''} from OCR extraction`);
  };

  // Handle manual task addition from OCR component
  const handleAddManualTaskFromOCR = () => {
    setShowOCRExtraction(false);
    addIspTask();
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDatabaseSetupComplete = () => {
    setCurrentStep(1); // Move to writing style step
  };

  // Analyze writing style when user types (simplified without analytics service)
  const analyzeWritingStyle = async (writingStyle: string) => {
    if (writingStyle.length < 100) {
      setStyleAnalysis(null);
      return;
    }

    setIsAnalyzing(true);
    try {
      // Simple local analysis without external service
      const wordCount = writingStyle.split(/\s+/).length;
      const sentenceCount = writingStyle.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
      const avgWordsPerSentence = wordCount / sentenceCount;

      let quality: 'excellent' | 'good' | 'fair' | 'needs_improvement' = 'good';
      let score = 75;

      if (writingStyle.length >= 200 && avgWordsPerSentence > 10 && avgWordsPerSentence < 25) {
        quality = 'excellent';
        score = 90;
      } else if (writingStyle.length < 150) {
        quality = 'needs_improvement';
        score = 50;
      }

      setStyleAnalysis({
        quality,
        score,
        suggestions: quality === 'needs_improvement' ? ['Consider providing a longer writing sample'] : ['Your writing style looks good!'],
        strengths: ['Professional tone', 'Clear structure'],
        weaknesses: quality === 'needs_improvement' ? ['Sample too short'] : []
      });
    } catch (error) {
      console.error('Style analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Debounced style analysis
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (watchedWritingStyle && watchedWritingStyle.length >= 100) {
        analyzeWritingStyle(watchedWritingStyle);
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [watchedWritingStyle]);

  // Check database status on component mount
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const status = await checkDatabaseStatus();
        if (status.isInitialized && status.tablesExist && status.userProfileExists) {
          setCurrentStep(1); // Skip database setup
        }
      } catch (error) {
        console.error('Database check failed:', error);
      }
    };

    checkDatabase();
  }, []);

  const onSubmit = async (data: SetupFormData) => {
    setIsLoading(true);

    try {
      const setupData: SetupData = {
        writingStyle: data.writingStyle,
        ispTasks: data.ispTasks.filter(task => task.description.trim())
      };

      const result = await completeSetup(setupData);

      if (result.success) {
        // Update user to mark setup as completed
        updateUser({ hasCompletedSetup: true });
        toast.success('Setup completed successfully! Welcome to SwiftNotes.');
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Setup failed. Please try again.');
      }
    } catch (error) {
      console.error('Setup error:', error);
      toast.error('Setup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
            {steps.map((step) => (
              <div key={step.name} className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                currentStep === step.id
                  ? 'border-blue-500 bg-blue-50'
                  : step.completed
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-center">
                  <div className="relative flex h-10 w-10 items-center justify-center flex-shrink-0">
                    {step.completed ? (
                      <div className="h-10 w-10 rounded-full progress-step progress-step-completed flex items-center justify-center">
                        <CheckIcon className="h-6 w-6 text-white" />
                      </div>
                    ) : currentStep === step.id ? (
                      <div className="h-10 w-10 rounded-full border-2 border-blue-600 bg-white progress-step progress-step-active flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-bold">{step.number}</span>
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-full border-2 progress-step progress-step-pending flex items-center justify-center">
                        <span className="text-gray-500 text-sm font-medium">{step.number}</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${
                      currentStep === step.id ? 'text-blue-700' :
                      step.completed ? 'text-green-700' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </nav>
      </div>

      {/* Setup Form */}
      <div className="bg-white shadow-sm rounded-lg">
        {/* Step 0: Database Setup */}
        {currentStep === 0 && (
          <div className="p-6">
            <DatabaseSetup onSetupComplete={handleDatabaseSetupComplete} />
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Writing Style */}
          {currentStep === 1 && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Provide Your Writing Style Sample
                </h2>
                <p className="text-gray-600">
                  To generate notes that match your unique writing style, please provide a sample
                  of your previous notes. This should be 100-3000 characters and represent your
                  typical documentation style.
                </p>
              </div>

              <div className="mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex">
                    <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Important: Sanitize Your Sample
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Please ensure your writing sample contains NO:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Client names or identifying information</li>
                          <li>Specific dates, locations, or addresses</li>
                          <li>Medical details or sensitive information</li>
                          <li>Any HIPAA-protected data</li>
                        </ul>
                        <p className="mt-2">
                          Use placeholders like "Client A", "the individual", or "the participant" instead.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <label htmlFor="writingStyle" className="block text-sm font-medium text-gray-700 mb-2">
                  Writing Style Sample *
                </label>
                <textarea
                  {...register('writingStyle')}
                  rows={12}
                  className={`textarea-with-counter ${errors.writingStyle ? 'input-error' : ''}`}
                  placeholder="Example: The individual demonstrated significant progress in their communication goals during today's session. They successfully completed three verbal requests using appropriate tone and volume. The participant showed improved eye contact and engaged in turn-taking activities for approximately 15 minutes..."
                />
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm text-gray-500">
                    {watchedWritingStyle?.length || 0} / 3000 characters
                  </div>
                  <div className="text-sm text-gray-500">
                    Minimum: 100 characters
                  </div>
                </div>
                {errors.writingStyle && (
                  <p className="mt-1 text-sm text-red-600">{errors.writingStyle.message}</p>
                )}
              </div>

              {/* Style Analysis Display */}
              {(isAnalyzing || styleAnalysis) && watchedWritingStyle && watchedWritingStyle.length >= 100 && (
                <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">📊</span>
                    Writing Style Analysis
                    {isAnalyzing && (
                      <div className="ml-2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </h3>

                  {styleAnalysis && (
                    <div className="space-y-3">
                      {/* Quality Score */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Quality Score:</span>
                        <div className="flex items-center">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            styleAnalysis.quality === 'excellent' ? 'bg-green-100 text-green-800' :
                            styleAnalysis.quality === 'good' ? 'bg-blue-100 text-blue-800' :
                            styleAnalysis.quality === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {styleAnalysis.quality.charAt(0).toUpperCase() + styleAnalysis.quality.slice(1)}
                          </div>
                          <span className="ml-2 text-sm text-gray-500">({styleAnalysis.score}/100)</span>
                        </div>
                      </div>

                      {/* Strengths */}
                      {styleAnalysis.strengths.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-green-700 mb-1">✅ Strengths:</h4>
                          <ul className="text-xs text-green-600 space-y-1">
                            {styleAnalysis.strengths.map((strength, index) => (
                              <li key={index}>• {strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Suggestions */}
                      {styleAnalysis.suggestions.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-blue-700 mb-1">💡 Suggestions:</h4>
                          <ul className="text-xs text-blue-600 space-y-1">
                            {styleAnalysis.suggestions.map((suggestion, index) => (
                              <li key={index}>• {suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Weaknesses */}
                      {styleAnalysis.weaknesses.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-orange-700 mb-1">⚠️ Areas for Improvement:</h4>
                          <ul className="text-xs text-orange-600 space-y-1">
                            {styleAnalysis.weaknesses.map((weakness, index) => (
                              <li key={index}>• {weakness}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!watchedWritingStyle || watchedWritingStyle.length < 100}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to ISP Tasks
                </button>
              </div>
            </div>
          )}

          {/* Step 2: ISP Tasks */}
          {currentStep === 2 && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Add Your Common ISP Tasks
                </h2>
                <p className="text-gray-600">
                  Add the ISP tasks you commonly document. These will be available as options
                  when generating notes. You can add tasks manually or extract them from a screenshot.
                </p>
              </div>

              {/* OCR Extraction Option */}
              {!showOCRExtraction && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <PhotoIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-blue-900 mb-1">
                        Extract Tasks from Screenshot
                      </h3>
                      <p className="text-sm text-blue-700 mb-3">
                        Have a screenshot of your ISP task list? Upload it and we'll automatically extract the tasks for you.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowOCRExtraction(true)}
                        className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <PhotoIcon className="h-4 w-4 mr-2" />
                        Upload Screenshot
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* OCR Extraction Component */}
              {showOCRExtraction && (
                <div className="mb-6">
                  <OCRTaskExtraction
                    onTasksExtracted={handleOCRTasksExtracted}
                    onAddManualTask={handleAddManualTaskFromOCR}
                  />
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => setShowOCRExtraction(false)}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Cancel and add tasks manually
                    </button>
                  </div>
                </div>
              )}

              {/* Manual Task Entry */}
              {!showOCRExtraction && (
                <>
                  <div className="space-y-4 mb-6">
                    {watchedIspTasks.map((task, index) => (
                  <div key={task.id} className="flex items-start space-x-3">
                    <div className="flex-1">
                      <label htmlFor={`task-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                        ISP Task {index + 1}
                      </label>
                      <AutoResizeTextarea
                        {...register(`ispTasks.${index}.description`)}
                        className="input-field"
                        placeholder="e.g., Communication goals - verbal requests, social interaction skills, daily living activities, etc."
                        minRows={2}
                        maxRows={6}
                      />
                      <div className="mt-1 flex justify-between items-center text-xs">
                        <span className={`${
                          (task.description?.length || 0) > 450 ? 'text-orange-600' :
                          (task.description?.length || 0) > 400 ? 'text-yellow-600' :
                          'text-gray-500'
                        }`}>
                          {task.description?.length || 0} / 500 characters
                        </span>
                        {(task.description?.length || 0) > 400 && (
                          <span className="text-xs text-orange-600">
                            {500 - (task.description?.length || 0)} remaining
                          </span>
                        )}
                      </div>
                      {errors.ispTasks?.[index]?.description && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.ispTasks[index]?.description?.message}
                        </p>
                      )}
                    </div>
                    {watchedIspTasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIspTask(task.id)}
                        className="mt-8 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                        title="Remove this task"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

                  <button
                    type="button"
                    onClick={addIspTask}
                    className="mb-6 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Another Task
                  </button>
                </>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn-outline"
                >
                  Back to Writing Style
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!watchedIspTasks.some(task => task.description.trim())}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Review & Complete
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Complete */}
          {currentStep === 3 && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Review Your Setup
                </h2>
                <p className="text-gray-600">
                  Please review your setup before completing. You can modify these settings
                  later in your profile.
                </p>
              </div>

              <div className="space-y-6 mb-8">
                {/* Writing Style Review */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Writing Style Sample</h3>
                  <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-700 max-h-32 overflow-y-auto">
                    {watchedWritingStyle}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {watchedWritingStyle?.length || 0} characters
                  </p>
                </div>

                {/* ISP Tasks Review */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">ISP Tasks</h3>
                  <ul className="space-y-2">
                    {watchedIspTasks.filter(task => task.description.trim()).map((task) => (
                      <li key={task.id} className="flex items-center text-sm text-gray-700">
                        <DocumentTextIcon className="h-5 w-5 text-primary-600 mr-2 flex-shrink-0" />
                        {task.description}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn-outline"
                >
                  Back to ISP Tasks
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="spinner w-4 h-4 mr-2"></div>
                      Completing Setup...
                    </div>
                  ) : (
                    'Complete Setup'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SetupPage;
