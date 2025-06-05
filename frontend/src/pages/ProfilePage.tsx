import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  UserIcon,
  PencilIcon,
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  DocumentTextIcon,
  TrashIcon,
  PlusIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  CloudArrowDownIcon,
  KeyIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/authStore';
import { userAPI, ispTasksAPI } from '../services/apiService';
import AutoResizeTextarea from '../components/AutoResizeTextarea';

// Validation schemas
const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: z.string().email('Invalid email address'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const writingStyleSchema = z.object({
  writingStyle: z.string()
    .min(100, 'Writing style sample must be at least 100 characters')
    .max(3000, 'Writing style sample must be less than 3000 characters'),
});

const ispTaskSchema = z.object({
  description: z.string().min(10, 'Task description must be at least 10 characters').max(500, 'Task description too long'),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type WritingStyleFormData = z.infer<typeof writingStyleSchema>;
type ISPTaskFormData = z.infer<typeof ispTaskSchema>;

interface ISPTask {
  id: string;
  description: string;
  order_index: number;
}

interface SettingsSection {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
}

const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('account');
  const [isLoading, setIsLoading] = useState(false);
  const [ispTasks, setIspTasks] = useState<ISPTask[]>([]);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { user, updateUser, signOut } = useAuthStore();

  // Load ISP tasks
  useEffect(() => {
    loadIspTasks();
  }, []);

  const loadIspTasks = async () => {
    try {
      const result = await ispTasksAPI.getTasks();
      if (result.success) {
        setIspTasks(result.tasks || []);
      }
    } catch (error) {
      console.error('Failed to load ISP tasks:', error);
    }
  };

  // Account Settings Component
  const AccountSettings: React.FC = () => {
    const {
      register: registerProfile,
      handleSubmit: handleSubmitProfile,
      formState: { errors: profileErrors },
      reset: resetProfile,
    } = useForm<ProfileFormData>({
      resolver: zodResolver(profileSchema),
      defaultValues: {
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
      },
    });

    const {
      register: registerPassword,
      handleSubmit: handleSubmitPassword,
      formState: { errors: passwordErrors },
      reset: resetPassword,
    } = useForm<PasswordFormData>({
      resolver: zodResolver(passwordSchema),
    });

    const onSubmitProfile = async (data: ProfileFormData) => {
      setIsLoading(true);
      try {
        const result = await userAPI.updateProfile(data);
        if (result.success) {
          await updateUser(result.user);
          toast.success('Profile updated successfully');
          resetProfile(data);
        } else {
          toast.error(result.error || 'Failed to update profile');
        }
      } catch (error) {
        toast.error('Failed to update profile');
      } finally {
        setIsLoading(false);
      }
    };

    const onSubmitPassword = async (data: PasswordFormData) => {
      setIsLoading(true);
      try {
        const result = await userAPI.changePassword({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        });
        if (result.success) {
          toast.success('Password changed successfully');
          resetPassword();
          setShowPasswordForm(false);
        } else {
          toast.error(result.error || 'Failed to change password');
        }
      } catch (error) {
        toast.error('Failed to change password');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        {/* Profile Information */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
          <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  {...registerProfile('firstName')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {profileErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{profileErrors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  {...registerProfile('lastName')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {profileErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{profileErrors.lastName.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                {...registerProfile('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {profileErrors.email && (
                <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Password Change */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Password</h3>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              {showPasswordForm ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {showPasswordForm && (
            <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  {...registerPassword('currentPassword')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  {...registerPassword('newPassword')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  {...registerPassword('confirmPassword')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    resetPassword();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  // Writing Preferences Component
  const WritingPreferences: React.FC = () => {
    const [defaultToneLevel, setDefaultToneLevel] = useState(user?.preferences?.defaultToneLevel ?? 50);
    const [defaultDetailLevel, setDefaultDetailLevel] = useState<'brief' | 'moderate' | 'detailed' | 'comprehensive'>(user?.preferences?.defaultDetailLevel ?? 'detailed');
    const [showWritingStyleForm, setShowWritingStyleForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Update state when user preferences change, but not during save operations
    useEffect(() => {
      if (user?.preferences && !isSaving) {
        setDefaultToneLevel(user.preferences.defaultToneLevel ?? 50);
        setDefaultDetailLevel(user.preferences.defaultDetailLevel ?? 'detailed');
      }
    }, [user?.preferences, isSaving]);

    const {
      register: registerWritingStyle,
      handleSubmit: handleSubmitWritingStyle,
      formState: { errors: writingStyleErrors },
      reset: resetWritingStyle,
      watch,
    } = useForm<WritingStyleFormData>({
      resolver: zodResolver(writingStyleSchema),
      defaultValues: {
        writingStyle: user?.writingStyle || '',
      },
    });

    const writingStyleValue = watch('writingStyle');

    const onSubmitWritingStyle = async (data: WritingStyleFormData) => {
      setIsLoading(true);
      try {
        const result = await userAPI.updateWritingStyle(data.writingStyle);
        if (result.success) {
          await updateUser({ ...user, writingStyle: data.writingStyle });
          toast.success('Writing style updated successfully');
          setShowWritingStyleForm(false);
        } else {
          toast.error(result.error || 'Failed to update writing style');
        }
      } catch (error) {
        toast.error('Failed to update writing style');
      } finally {
        setIsLoading(false);
      }
    };

    const savePreferences = async () => {
      setIsLoading(true);
      setIsSaving(true);
      try {
        const result = await userAPI.updatePreferences({
          defaultToneLevel,
          defaultDetailLevel,
        });
        if (result.success) {
          // Update user state with new preferences
          await updateUser({
            ...user,
            preferences: {
              ...user?.preferences,
              defaultToneLevel,
              defaultDetailLevel,
            }
          });
          toast.success('Preferences saved successfully');
        } else {
          toast.error(result.error || 'Failed to save preferences');
        }
      } catch (error) {
        toast.error('Failed to save preferences');
      } finally {
        setIsLoading(false);
        // Small delay to ensure user state update is complete before allowing useEffect to run
        setTimeout(() => setIsSaving(false), 100);
      }
    };

    return (
      <div className="space-y-6">
        {/* Writing Style */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Writing Style Sample</h3>
              <p className="text-sm text-gray-600 mt-1">
                This sample helps AI match your authentic writing style
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {user?.writingStyle && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                  Configured
                </span>
              )}
              <button
                onClick={() => setShowWritingStyleForm(!showWritingStyleForm)}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                {showWritingStyleForm ? 'Cancel' : user?.writingStyle ? 'Update' : 'Add Sample'}
              </button>
            </div>
          </div>

          {user?.writingStyle && !showWritingStyleForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {user.writingStyle.substring(0, 300)}
                {user.writingStyle.length > 300 && '...'}
              </p>
              <div className="mt-2 text-xs text-gray-500">
                {user.writingStyle.length} characters
              </div>
            </div>
          )}

          {showWritingStyleForm && (
            <form onSubmit={handleSubmitWritingStyle(onSubmitWritingStyle)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Writing Style Sample
                </label>
                <AutoResizeTextarea
                  {...registerWritingStyle('writingStyle')}
                  placeholder="Paste a sample of your professional writing here (at least 100 characters)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  minRows={4}
                  maxRows={12}
                />
                <div className="mt-1 flex justify-between">
                  {writingStyleErrors.writingStyle && (
                    <p className="text-sm text-red-600">{writingStyleErrors.writingStyle.message}</p>
                  )}
                  <p className="text-xs text-gray-500 ml-auto">
                    {writingStyleValue?.length || 0} / 3000 characters
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowWritingStyleForm(false);
                    resetWritingStyle();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Save Writing Style'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Default Preferences */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Default Generation Settings</h3>

          <div className="space-y-6">
            {/* Default Tone Level */}
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
                    value={defaultToneLevel}
                    onChange={(e) => setDefaultToneLevel(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${defaultToneLevel}%, #E5E7EB ${defaultToneLevel}%, #E5E7EB 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span className="font-medium text-gray-700">{defaultToneLevel}</span>
                    <span>100</span>
                  </div>
                </div>
                <div className="text-xs text-gray-600 text-center">
                  {defaultToneLevel < 25 && "Personal writing style with natural expressions"}
                  {defaultToneLevel >= 25 && defaultToneLevel < 50 && "Balanced tone with some personal touch"}
                  {defaultToneLevel >= 50 && defaultToneLevel < 75 && "Professional with clinical standards"}
                  {defaultToneLevel >= 75 && "Formal clinical documentation style"}
                </div>
              </div>
            </div>

            {/* Default Detail Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Detail Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'brief', label: 'Brief', description: 'Concise notes' },
                  { value: 'moderate', label: 'Moderate', description: 'Balanced detail' },
                  { value: 'detailed', label: 'Detailed', description: 'Comprehensive' },
                  { value: 'comprehensive', label: 'Comprehensive', description: 'Maximum detail' },
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setDefaultDetailLevel(level.value as any)}
                    className={`p-3 text-left rounded-md border transition-colors ${
                      defaultDetailLevel === level.value
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

            <div className="flex justify-end">
              <button
                onClick={savePreferences}
                disabled={isLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ISP Tasks Management Component
  const ISPTasksManagement: React.FC = () => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingTask, setEditingTask] = useState<ISPTask | null>(null);

    const {
      register: registerTask,
      handleSubmit: handleSubmitTask,
      formState: { errors: taskErrors },
      reset: resetTask,
      setValue: setTaskValue,
    } = useForm<ISPTaskFormData>({
      resolver: zodResolver(ispTaskSchema),
    });

    const onSubmitTask = async (data: ISPTaskFormData) => {
      setIsLoading(true);
      try {
        let result;
        if (editingTask) {
          result = await ispTasksAPI.updateTask(editingTask.id, data.description);
        } else {
          result = await ispTasksAPI.addTask(data.description);
        }

        if (result.success) {
          toast.success(editingTask ? 'Task updated successfully' : 'Task added successfully');
          await loadIspTasks();
          resetTask();
          setShowAddForm(false);
          setEditingTask(null);
        } else {
          toast.error(result.error || 'Failed to save task');
        }
      } catch (error) {
        toast.error('Failed to save task');
      } finally {
        setIsLoading(false);
      }
    };

    const deleteTask = async (taskId: string) => {
      if (!confirm('Are you sure you want to delete this task?')) return;

      setIsLoading(true);
      try {
        const result = await ispTasksAPI.deleteTask(taskId);
        if (result.success) {
          toast.success('Task deleted successfully');
          await loadIspTasks();
        } else {
          toast.error(result.error || 'Failed to delete task');
        }
      } catch (error) {
        toast.error('Failed to delete task');
      } finally {
        setIsLoading(false);
      }
    };

    const startEdit = (task: ISPTask) => {
      setEditingTask(task);
      setTaskValue('description', task.description);
      setShowAddForm(true);
    };

    const cancelEdit = () => {
      setEditingTask(null);
      setShowAddForm(false);
      resetTask();
    };

    return (
      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">ISP Tasks</h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage your Individual Service Plan tasks for note generation
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Task
            </button>
          </div>

          {/* Add/Edit Task Form */}
          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-3">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h4>
              <form onSubmit={handleSubmitTask(onSubmitTask)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Description
                  </label>
                  <AutoResizeTextarea
                    {...registerTask('description')}
                    placeholder="Enter ISP task description (e.g., 'Communication goals - verbal requests')"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    minRows={2}
                    maxRows={6}
                  />
                  {taskErrors.description && (
                    <p className="mt-1 text-sm text-red-600">{taskErrors.description.message}</p>
                  )}
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Saving...' : editingTask ? 'Update Task' : 'Add Task'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tasks List */}
          <div className="space-y-3">
            {ispTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No ISP tasks configured yet</p>
                <p className="text-sm">Add your first task to get started</p>
              </div>
            ) : (
              ispTasks.map((task, index) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-600 rounded-full text-xs font-medium">
                        {index + 1}
                      </span>
                      <p className="text-gray-900">{task.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEdit(task)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-200"
                      title="Edit task"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 text-red-400 hover:text-red-600 rounded-md hover:bg-red-50"
                      title="Delete task"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // Data & Privacy Component
  const DataPrivacy: React.FC = () => {
    const exportData = async () => {
      setIsLoading(true);
      try {
        const result = await userAPI.exportData();
        if (result.success) {
          // Create and download file
          const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `swiftnotes-data-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('Data exported successfully');
        } else {
          toast.error(result.error || 'Failed to export data');
        }
      } catch (error) {
        toast.error('Failed to export data');
      } finally {
        setIsLoading(false);
      }
    };

    const deleteAccount = async () => {
      if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
      if (!confirm('This will permanently delete all your data. Are you absolutely sure?')) return;

      setIsLoading(true);
      try {
        const result = await userAPI.deleteAccount();
        if (result.success) {
          toast.success('Account deleted successfully');
          await signOut();
        } else {
          toast.error(result.error || 'Failed to delete account');
        }
      } catch (error) {
        toast.error('Failed to delete account');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        {/* Data Export */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Data Export</h3>
          <p className="text-sm text-gray-600 mb-4">
            Download all your data including notes, ISP tasks, and preferences in JSON format.
          </p>
          <button
            onClick={exportData}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CloudArrowDownIcon className="h-4 w-4 mr-2" />
            {isLoading ? 'Exporting...' : 'Export Data'}
          </button>
        </div>

        {/* Account Deletion */}
        <div className="bg-white shadow-sm rounded-lg p-6 border-red-200">
          <h3 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800">Delete Account</h4>
                <p className="text-sm text-red-700 mt-1">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="mt-3 inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Delete Account</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete your account? All your data will be permanently removed.
                    This action cannot be undone.
                  </p>
                </div>
                <div className="flex justify-center space-x-3 mt-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteAccount}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Billing & Credits Component
  const BillingCredits: React.FC = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Credits & Usage</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-primary-50 rounded-lg p-4">
              <div className="flex items-center">
                <CreditCardIcon className="h-8 w-8 text-primary-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-primary-900">Current Credits</p>
                  <p className="text-2xl font-bold text-primary-600">{user?.credits || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-gray-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">This Month</p>
                  <p className="text-2xl font-bold text-gray-600">0</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-gray-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Total Notes</p>
                  <p className="text-2xl font-bold text-gray-600">0</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Credit Packages</h4>
            <p className="text-sm text-gray-600 mb-4">
              Purchase additional credits for note generation. Each note typically uses 1-3 credits depending on length and complexity.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { credits: 100, price: '$9.99', popular: false },
                { credits: 500, price: '$39.99', popular: true },
                { credits: 1000, price: '$69.99', popular: false },
              ].map((package_) => (
                <div
                  key={package_.credits}
                  className={`relative border rounded-lg p-4 ${
                    package_.popular ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                  }`}
                >
                  {package_.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary-500 text-white px-3 py-1 text-xs font-medium rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{package_.credits}</p>
                    <p className="text-sm text-gray-600">credits</p>
                    <p className="text-lg font-semibold text-gray-900 mt-2">{package_.price}</p>
                    <button className="mt-3 w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                      Purchase
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Settings sections configuration
  const settingsSections: SettingsSection[] = [
    {
      id: 'account',
      name: 'Account',
      description: 'Profile information and password',
      icon: UserIcon,
      component: AccountSettings,
    },
    {
      id: 'writing',
      name: 'Writing Preferences',
      description: 'Writing style and generation settings',
      icon: PencilIcon,
      component: WritingPreferences,
    },
    {
      id: 'isp-tasks',
      name: 'ISP Tasks',
      description: 'Manage your Individual Service Plan tasks',
      icon: DocumentTextIcon,
      component: ISPTasksManagement,
    },
    {
      id: 'billing',
      name: 'Billing & Credits',
      description: 'Manage credits and billing information',
      icon: CreditCardIcon,
      component: BillingCredits,
    },
    {
      id: 'privacy',
      name: 'Data & Privacy',
      description: 'Export data and account deletion',
      icon: ShieldCheckIcon,
      component: DataPrivacy,
    },
  ];

  const ActiveComponent = settingsSections.find(section => section.id === activeSection)?.component || AccountSettings;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account, preferences, and application settings
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
        {/* Settings Navigation */}
        <aside className="lg:col-span-3">
          <nav className="space-y-1">
            {settingsSections.map((section) => {
              const isActive = activeSection === section.id;
              const Icon = section.icon;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700 border-primary-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{section.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{section.description}</div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 ml-2" />
                </button>
              );
            })}
          </nav>

          {/* Quick Stats */}
          <div className="mt-8 bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Credits</span>
                <span className="font-medium text-gray-900">{user?.credits || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Setup Status</span>
                <span className={`font-medium ${user?.hasCompletedSetup ? 'text-green-600' : 'text-orange-600'}`}>
                  {user?.hasCompletedSetup ? 'Complete' : 'Incomplete'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Writing Style</span>
                <span className={`font-medium ${user?.writingStyle ? 'text-green-600' : 'text-gray-400'}`}>
                  {user?.writingStyle ? 'Configured' : 'Not Set'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ISP Tasks</span>
                <span className="font-medium text-gray-900">{ispTasks.length}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Settings Content */}
        <main className="lg:col-span-9 mt-8 lg:mt-0">
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {settingsSections.find(section => section.id === activeSection)?.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {settingsSections.find(section => section.id === activeSection)?.description}
              </p>
            </div>
            <div className="p-6">
              <ActiveComponent />
            </div>
          </div>
        </main>
      </div>

      {/* Custom CSS for sliders */}
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
    </div>
  );
};

export default SettingsPage;
