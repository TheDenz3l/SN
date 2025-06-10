import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../stores/authStore';
import { completeSetup, checkDatabaseStatus, initializeDatabase } from '../services/setupService';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  CogIcon,
  DocumentTextIcon,
  ListBulletIcon,
  SparklesIcon,
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
  ClockIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

// Import our intuitive components
import IntuitiveCard, { ActionCard } from '../components/intuitive/IntuitiveCard';
import IntuitiveButton from '../components/intuitive/IntuitiveButton';



interface SetupData {
  writingStyle: string;
  ispTasks: Array<{ id: string; description: string }>;
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

const IntuitiveSetupPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDatabaseSetupLoading, setIsDatabaseSetupLoading] = useState(false);


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
    mode: 'onSubmit',
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
      icon: CogIcon,
      completed: currentStep > 0,
    },
    {
      id: 1,
      number: 2,
      name: 'Writing Style',
      description: 'Provide a sample of your writing style',
      icon: DocumentTextIcon,
      completed: currentStep > 1,
    },
    {
      id: 2,
      number: 3,
      name: 'ISP Tasks',
      description: 'Add your common ISP tasks',
      icon: ListBulletIcon,
      completed: currentStep > 2,
    },
    {
      id: 3,
      number: 4,
      name: 'Complete',
      description: 'Finish setup and start generating notes',
      icon: CheckCircleIcon,
      completed: false,
    },
  ];

  // Check database status on component mount
  useEffect(() => {
    checkInitialDatabaseStatus();
  }, []);

  const checkInitialDatabaseStatus = async () => {
    try {
      const status = await checkDatabaseStatus();
      if (status.tablesExist && status.userProfileExists) {
        setCurrentStep(1); // Skip to writing style step
      }
    } catch (error) {
      console.error('Error checking database status:', error);
    }
  };

  const handleDatabaseSetup = async () => {
    setIsDatabaseSetupLoading(true);
    try {
      const result = await initializeDatabase();
      if (result.success) {
        toast.success('Database initialized successfully!');
        setCurrentStep(1);
      } else {
        toast.error(result.error || 'Database setup failed');
      }
    } catch (error) {
      console.error('Database setup error:', error);
      toast.error('Database setup failed. Please try again.');
    } finally {
      setIsDatabaseSetupLoading(false);
    }
  };

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

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: SetupFormData) => {
    setIsLoading(true);

    try {
      const setupData: SetupData = {
        writingStyle: data.writingStyle,
        ispTasks: data.ispTasks.filter(task => task.description.trim())
      };

      const result = await completeSetup(setupData);

      if (result.success) {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <SparklesIcon className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to SwiftNotes</h1>
          <p className="text-lg text-gray-600">
            Let's set up your account to start generating personalized notes
          </p>
        </div>

        {/* Progress Steps */}
        <IntuitiveCard variant="subtle" padding="lg" className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = step.completed;
              const isAccessible = step.id <= currentStep || isCompleted;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                        isCompleted
                          ? 'bg-green-100 text-green-600'
                          : isActive
                          ? 'bg-primary-100 text-primary-600'
                          : isAccessible
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-gray-50 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckIcon className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div
                        className={`text-sm font-medium ${
                          isActive ? 'text-primary-600' : isCompleted ? 'text-green-600' : 'text-gray-600'
                        }`}
                      >
                        {step.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 max-w-24">
                        {step.description}
                      </div>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 transition-all duration-200 ${
                        step.completed ? 'bg-green-200' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </IntuitiveCard>

        {/* Setup Content */}
        <div className="space-y-8">
          {/* Step 0: Database Setup */}
          {currentStep === 0 && (
            <IntuitiveCard variant="default" padding="lg">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <CogIcon className="w-8 h-8 text-primary-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Initialize Your Database
                </h2>

                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                  We need to set up your personal database to store your notes, writing style,
                  and ISP tasks securely. This is a one-time setup that takes just a few seconds.
                </p>

                <div className="flex items-center justify-center space-x-4 mb-8">
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                    Secure & Private
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                    One-time Setup
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                    Quick & Easy
                  </div>
                </div>

                <IntuitiveButton
                  variant="primary"
                  size="lg"
                  onClick={handleDatabaseSetup}
                  isLoading={isDatabaseSetupLoading}
                  icon={<CogIcon />}
                  className="min-w-[200px]"
                >
                  {isDatabaseSetupLoading ? 'Setting up...' : 'Initialize Database'}
                </IntuitiveButton>
              </div>
            </IntuitiveCard>
          )}

          {/* Step 1: Writing Style */}
          {currentStep === 1 && (
            <form onSubmit={handleSubmit(onSubmit)}>
              <IntuitiveCard variant="default" padding="lg">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <DocumentTextIcon className="w-8 h-8 text-primary-600" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Provide Your Writing Style Sample
                    </h2>

                    <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                      To generate notes that match your unique writing style, please provide a sample
                      of your previous notes. This should be 100-3000 characters and represent your
                      typical documentation style.
                    </p>
                  </div>

                  <div className="max-w-3xl mx-auto">
                    <label htmlFor="writingStyle" className="block text-lg font-semibold text-gray-900 mb-4">
                      Writing Style Sample *
                    </label>

                    <div className="relative">
                      <textarea
                        {...register('writingStyle')}
                        rows={12}
                        className={`w-full px-4 py-3 border rounded-xl shadow-card focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 resize-none ${
                          errors.writingStyle ? 'border-red-300 focus:ring-red-200 focus:border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Example: The individual demonstrated significant progress in their communication goals during today's session. They successfully completed three verbal requests using appropriate tone and volume. The participant showed improved eye contact and engaged in turn-taking activities for approximately 15 minutes..."
                      />

                      <div className="absolute bottom-3 right-3 text-sm text-gray-500 bg-white px-2 py-1 rounded">
                        {watchedWritingStyle?.length || 0} / 3000
                      </div>
                    </div>

                    {errors.writingStyle && (
                      <div className="mt-2 flex items-center text-red-600 text-sm">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        {errors.writingStyle.message}
                      </div>
                    )}

                    <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                      <div className="flex items-start">
                        <InformationCircleIcon className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">Tips for a good writing sample:</p>
                          <ul className="list-disc list-inside space-y-1 text-blue-700">
                            <li>Include your typical note structure and format</li>
                            <li>Use professional language you normally use</li>
                            <li>Include specific details and observations</li>
                            <li>Show your documentation style for progress and goals</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <IntuitiveButton
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={prevStep}
                      icon={<ArrowLeftIcon />}
                    >
                      Back to Database
                    </IntuitiveButton>

                    <IntuitiveButton
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={nextStep}
                      disabled={!watchedWritingStyle || watchedWritingStyle.length < 100}
                      icon={<ArrowRightIcon />}
                    >
                      Continue to ISP Tasks
                    </IntuitiveButton>
                  </div>
                </div>
              </IntuitiveCard>
            </form>
          )}

          {/* Step 2: ISP Tasks */}
          {currentStep === 2 && (
            <form onSubmit={handleSubmit(onSubmit)}>
              <IntuitiveCard variant="default" padding="lg">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <ListBulletIcon className="w-8 h-8 text-primary-600" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Add Your ISP Tasks
                    </h2>

                    <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                      Add the common ISP (Individualized Service Plan) tasks you work on with clients.
                      These will be available as quick options when generating notes.
                    </p>
                  </div>

                  <div className="max-w-3xl mx-auto space-y-4">
                    {watchedIspTasks.map((task, index) => (
                      <div key={task.id} className="relative">
                        <div className="flex items-start space-x-3">
                          <div className="flex-1">
                            <label htmlFor={`task-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                              ISP Task {index + 1}
                            </label>
                            <textarea
                              {...register(`ispTasks.${index}.description`)}
                              className={`w-full px-4 py-3 border rounded-xl shadow-card focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 resize-none ${
                                errors.ispTasks?.[index]?.description ? 'border-red-300 focus:ring-red-200 focus:border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="e.g., Communication goals - verbal requests, social interaction skills, daily living activities, etc."
                              rows={3}
                            />

                            <div className="mt-1 flex justify-between items-center text-xs">
                              <span className={`${
                                (task.description?.length || 0) > 450 ? 'text-orange-600' :
                                (task.description?.length || 0) > 400 ? 'text-yellow-600' : 'text-gray-500'
                              }`}>
                                {task.description?.length || 0} / 500 characters
                              </span>
                            </div>

                            {errors.ispTasks?.[index]?.description && (
                              <div className="mt-1 flex items-center text-red-600 text-sm">
                                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                                {errors.ispTasks[index].description.message}
                              </div>
                            )}
                          </div>

                          {watchedIspTasks.length > 1 && (
                            <IntuitiveButton
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeIspTask(task.id)}
                              icon={<TrashIcon />}
                              tooltip="Remove task"
                              className="mt-8"
                            />
                          )}
                        </div>
                      </div>
                    ))}

                    <IntuitiveButton
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={addIspTask}
                      icon={<PlusIcon />}
                      className="w-full sm:w-auto"
                    >
                      Add Another Task
                    </IntuitiveButton>

                    <div className="mt-6 p-4 bg-green-50 rounded-xl">
                      <div className="flex items-start">
                        <InformationCircleIcon className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-green-800">
                          <p className="font-medium mb-1">Examples of good ISP tasks:</p>
                          <ul className="list-disc list-inside space-y-1 text-green-700">
                            <li>Communication goals - verbal requests and social interaction</li>
                            <li>Daily living skills - personal hygiene and meal preparation</li>
                            <li>Behavioral goals - emotional regulation and coping strategies</li>
                            <li>Academic skills - reading comprehension and math concepts</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <IntuitiveButton
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={prevStep}
                      icon={<ArrowLeftIcon />}
                    >
                      Back to Writing Style
                    </IntuitiveButton>

                    <IntuitiveButton
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={nextStep}
                      disabled={!watchedIspTasks.some(task => task.description.trim())}
                      icon={<ArrowRightIcon />}
                    >
                      Review & Complete
                    </IntuitiveButton>
                  </div>
                </div>
              </IntuitiveCard>
            </form>
          )}

          {/* Step 3: Complete */}
          {currentStep === 3 && (
            <form onSubmit={handleSubmit(onSubmit)}>
              <IntuitiveCard variant="default" padding="lg">
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <CheckCircleIcon className="w-8 h-8 text-green-600" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Review & Complete Setup
                    </h2>

                    <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                      Please review your setup information below. Once you complete the setup,
                      you'll be ready to start generating personalized notes!
                    </p>
                  </div>

                  {/* Review Summary */}
                  <div className="max-w-3xl mx-auto space-y-6">
                    {/* Writing Style Review */}
                    <IntuitiveCard variant="subtle" padding="md">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <DocumentTextIcon className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Writing Style Sample</h3>
                          <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                            {watchedWritingStyle?.substring(0, 200)}
                            {watchedWritingStyle && watchedWritingStyle.length > 200 && '...'}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            {watchedWritingStyle?.length || 0} characters
                          </div>
                        </div>
                      </div>
                    </IntuitiveCard>

                    {/* ISP Tasks Review */}
                    <IntuitiveCard variant="subtle" padding="md">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ListBulletIcon className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            ISP Tasks ({watchedIspTasks.filter(task => task.description.trim()).length})
                          </h3>
                          <div className="space-y-2">
                            {watchedIspTasks
                              .filter(task => task.description.trim())
                              .map((task, index) => (
                                <div key={task.id} className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                                  <span className="font-medium">Task {index + 1}:</span> {task.description}
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </IntuitiveCard>
                  </div>

                  <div className="flex justify-between pt-6">
                    <IntuitiveButton
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={prevStep}
                      icon={<ArrowLeftIcon />}
                    >
                      Back to ISP Tasks
                    </IntuitiveButton>

                    <IntuitiveButton
                      type="submit"
                      variant="primary"
                      size="lg"
                      isLoading={isLoading}
                      icon={<CheckCircleIcon />}
                      className="min-w-[180px]"
                    >
                      {isLoading ? 'Completing Setup...' : 'Complete Setup'}
                    </IntuitiveButton>
                  </div>
                </div>
              </IntuitiveCard>
            </form>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ActionCard
              title="Need Help?"
              description="Get assistance with the setup process"
              action="Contact support"
              icon={<InformationCircleIcon className="w-6 h-6" />}
              onClick={() => toast('Support feature coming soon!')}
            />

            <ActionCard
              title="Skip for Now"
              description="Complete setup later from your dashboard"
              action="Go to dashboard"
              icon={<ClockIcon className="w-6 h-6" />}
              onClick={() => navigate('/dashboard')}
            />

            <ActionCard
              title="Learn More"
              description="Understand how SwiftNotes works"
              action="View guide"
              icon={<AcademicCapIcon className="w-6 h-6" />}
              onClick={() => toast('User guide coming soon!')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntuitiveSetupPage;
