import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  UserIcon,
  PencilIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  DocumentTextIcon,
  TrashIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CloudArrowDownIcon,
  ChartBarIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  CogIcon,
  BellIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/authStore';
import { userAPI, ispTasksAPI } from '../services/apiService';

// Import our intuitive components
import IntuitiveCard, { ActionCard } from '../components/intuitive/IntuitiveCard';
import IntuitiveButton from '../components/intuitive/IntuitiveButton';
import { Badge } from '../components/ui';

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
  badge?: string;
}

const IntuitiveProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('account');
  const [isLoading, setIsLoading] = useState(false);
  const [ispTasks, setIspTasks] = useState<ISPTask[]>([]);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
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

  // Settings sections configuration
  const settingsSections: SettingsSection[] = [
    {
      id: 'account',
      name: 'Account',
      description: 'Profile information and security',
      icon: UserIcon,
    },
    {
      id: 'writing',
      name: 'Writing Style',
      description: 'Customize your writing preferences',
      icon: PencilIcon,
      badge: user?.writingStyle ? undefined : 'Setup Required',
    },
    {
      id: 'isp-tasks',
      name: 'ISP Tasks',
      description: 'Manage your service plan tasks',
      icon: DocumentTextIcon,
      badge: ispTasks.length === 0 ? 'Setup Required' : undefined,
    },
    {
      id: 'billing',
      name: 'Credits & Billing',
      description: 'Manage your account credits',
      icon: CreditCardIcon,
    },
    {
      id: 'privacy',
      name: 'Data & Privacy',
      description: 'Export data and privacy settings',
      icon: ShieldCheckIcon,
    },
    {
      id: 'preferences',
      name: 'Preferences',
      description: 'App settings and notifications',
      icon: CogIcon,
    },
  ];

  const getUserInitials = () => {
    const firstName = user?.firstName || '';
    const lastName = user?.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Page Header */}
      <IntuitiveCard variant="subtle" padding="lg">
        <div className="flex items-center space-x-6">
          {/* User Avatar */}
          <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-600">
              {getUserInitials()}
            </span>
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {getUserDisplayName()}
            </h1>
            <p className="text-gray-600 text-lg mb-4">
              Manage your account settings and preferences
            </p>
            
            {/* Quick Stats */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center text-gray-600">
                <CreditCardIcon className="w-4 h-4 mr-1" />
                <span className="font-medium">{user?.credits || 0} credits</span>
              </div>
              <div className="flex items-center text-gray-600">
                <CheckCircleIcon className={`w-4 h-4 mr-1 ${user?.hasCompletedSetup ? 'text-green-500' : 'text-orange-500'}`} />
                <span className={user?.hasCompletedSetup ? 'text-green-600' : 'text-orange-600'}>
                  Setup {user?.hasCompletedSetup ? 'Complete' : 'Incomplete'}
                </span>
              </div>
              <div className="flex items-center text-gray-600">
                <DocumentTextIcon className="w-4 h-4 mr-1" />
                <span>{ispTasks.length} ISP tasks</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <IntuitiveButton
              variant="outline"
              size="md"
              onClick={() => navigate('/dashboard')}
              icon={<ChartBarIcon />}
            >
              Dashboard
            </IntuitiveButton>
          </div>
        </div>
      </IntuitiveCard>

      {/* Settings Navigation and Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <IntuitiveCard variant="default" padding="md">
            <nav className="space-y-2">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-100 text-primary-700 shadow-sm border border-primary-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{section.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{section.description}</div>
                    </div>
                    
                    {section.badge && (
                      <Badge
                        variant="warning"
                        style="subtle"
                        size="sm"
                        className="ml-2"
                      >
                        {section.badge}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </nav>
          </IntuitiveCard>

          {/* Quick Actions */}
          <div className="mt-6 space-y-3">
            <ActionCard
              title="Complete Setup"
              description="Finish your account configuration"
              action="Go to setup"
              icon={<CogIcon className="w-5 h-5" />}
              onClick={() => navigate('/setup')}
              disabled={user?.hasCompletedSetup}
            />
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {/* Account Settings */}
          {activeSection === 'account' && (
            <AccountSettings 
              user={user}
              updateUser={updateUser}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              showPasswordForm={showPasswordForm}
              setShowPasswordForm={setShowPasswordForm}
              showPasswordFields={showPasswordFields}
              setShowPasswordFields={setShowPasswordFields}
            />
          )}

          {/* Writing Style Settings */}
          {activeSection === 'writing' && (
            <WritingStyleSettings 
              user={user}
              updateUser={updateUser}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}

          {/* ISP Tasks Settings */}
          {activeSection === 'isp-tasks' && (
            <ISPTasksSettings 
              ispTasks={ispTasks}
              loadIspTasks={loadIspTasks}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}

          {/* Billing Settings */}
          {activeSection === 'billing' && (
            <BillingSettings 
              user={user}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}

          {/* Privacy Settings */}
          {activeSection === 'privacy' && (
            <PrivacySettings 
              user={user}
              signOut={signOut}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}

          {/* Preferences Settings */}
          {activeSection === 'preferences' && (
            <PreferencesSettings 
              user={user}
              updateUser={updateUser}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Account Settings Component
const AccountSettings: React.FC<{
  user: any;
  updateUser: any;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  showPasswordForm: boolean;
  setShowPasswordForm: (show: boolean) => void;
  showPasswordFields: boolean;
  setShowPasswordFields: (show: boolean) => void;
}> = ({ user, updateUser, isLoading, setIsLoading, showPasswordForm, setShowPasswordForm, showPasswordFields, setShowPasswordFields }) => {
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
      const result = await userAPI.updatePassword(data.currentPassword, data.newPassword);
      if (result.success) {
        toast.success('Password updated successfully');
        resetPassword();
        setShowPasswordForm(false);
      } else {
        toast.error(result.error || 'Failed to update password');
      }
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <IntuitiveCard variant="default" padding="lg">
        <div className="flex items-center space-x-4 mb-6">
          <UserIcon className="w-6 h-6 text-primary-600" />
          <h3 className="text-xl font-semibold text-gray-900">Profile Information</h3>
        </div>

        <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                {...registerProfile('firstName')}
                className={`w-full px-4 py-3 border rounded-xl shadow-card focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 ${
                  profileErrors.firstName ? 'border-red-300 focus:ring-red-200 focus:border-red-500' : 'border-gray-300'
                }`}
              />
              {profileErrors.firstName && (
                <div className="mt-1 flex items-center text-red-600 text-sm">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {profileErrors.firstName.message}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                {...registerProfile('lastName')}
                className={`w-full px-4 py-3 border rounded-xl shadow-card focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 ${
                  profileErrors.lastName ? 'border-red-300 focus:ring-red-200 focus:border-red-500' : 'border-gray-300'
                }`}
              />
              {profileErrors.lastName && (
                <div className="mt-1 flex items-center text-red-600 text-sm">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {profileErrors.lastName.message}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              {...registerProfile('email')}
              className={`w-full px-4 py-3 border rounded-xl shadow-card focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 ${
                profileErrors.email ? 'border-red-300 focus:ring-red-200 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {profileErrors.email && (
              <div className="mt-1 flex items-center text-red-600 text-sm">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                {profileErrors.email.message}
              </div>
            )}
          </div>

          <div className="pt-4">
            <IntuitiveButton
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              icon={<CheckCircleIcon />}
            >
              {isLoading ? 'Updating...' : 'Update Profile'}
            </IntuitiveButton>
          </div>
        </form>
      </IntuitiveCard>

      {/* Password Security */}
      <IntuitiveCard variant="default" padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <KeyIcon className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Password & Security</h3>
              <p className="text-sm text-gray-600 mt-1">Keep your account secure with a strong password</p>
            </div>
          </div>

          <IntuitiveButton
            variant={showPasswordForm ? "outline" : "primary"}
            size="md"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            icon={<KeyIcon />}
          >
            {showPasswordForm ? 'Cancel' : 'Change Password'}
          </IntuitiveButton>
        </div>

        {showPasswordForm && (
          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswordFields ? "text" : "password"}
                  {...registerPassword('currentPassword')}
                  className={`w-full px-4 py-3 pr-12 border rounded-xl shadow-card focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 ${
                    passwordErrors.currentPassword ? 'border-red-300 focus:ring-red-200 focus:border-red-500' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordFields(!showPasswordFields)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswordFields ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <div className="mt-1 flex items-center text-red-600 text-sm">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {passwordErrors.currentPassword.message}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type={showPasswordFields ? "text" : "password"}
                {...registerPassword('newPassword')}
                className={`w-full px-4 py-3 border rounded-xl shadow-card focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 ${
                  passwordErrors.newPassword ? 'border-red-300 focus:ring-red-200 focus:border-red-500' : 'border-gray-300'
                }`}
              />
              {passwordErrors.newPassword && (
                <div className="mt-1 flex items-center text-red-600 text-sm">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {passwordErrors.newPassword.message}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type={showPasswordFields ? "text" : "password"}
                {...registerPassword('confirmPassword')}
                className={`w-full px-4 py-3 border rounded-xl shadow-card focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 ${
                  passwordErrors.confirmPassword ? 'border-red-300 focus:ring-red-200 focus:border-red-500' : 'border-gray-300'
                }`}
              />
              {passwordErrors.confirmPassword && (
                <div className="mt-1 flex items-center text-red-600 text-sm">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {passwordErrors.confirmPassword.message}
                </div>
              )}
            </div>

            <div className="pt-4">
              <IntuitiveButton
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                icon={<KeyIcon />}
              >
                {isLoading ? 'Updating Password...' : 'Update Password'}
              </IntuitiveButton>
            </div>
          </form>
        )}

        {!showPasswordForm && (
          <div className="p-4 bg-green-50 rounded-xl">
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3" />
              <div className="text-sm text-green-800">
                <p className="font-medium">Password is secure</p>
                <p className="text-green-700">Last updated: Never (using default password)</p>
              </div>
            </div>
          </div>
        )}
      </IntuitiveCard>
    </div>
  );
};

// Writing Style Settings Component
const WritingStyleSettings: React.FC<{
  user: any;
  updateUser: any;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}> = ({ user, updateUser, isLoading, setIsLoading }) => {
  const [showWritingStyleForm, setShowWritingStyleForm] = useState(false);

  // Generation defaults state management (adapted from DefaultGenerationSettings)
  const [toneLevel, setToneLevel] = useState<number>(50);
  const [detailLevel, setDetailLevel] = useState<'brief' | 'moderate' | 'detailed' | 'comprehensive'>('brief');
  const [useTimePatterns, setUseTimePatterns] = useState<boolean>(true);
  const [isGenerationInitialized, setIsGenerationInitialized] = useState(false);

  // Track the last saved values for generation defaults
  const lastSavedGenerationValues = useRef({
    toneLevel: 50,
    detailLevel: 'brief' as 'brief' | 'moderate' | 'detailed' | 'comprehensive',
    useTimePatterns: true
  });

  // Track user interactions for generation defaults
  const hasGenerationInteracted = useRef(false);
  const isSavingGeneration = useRef(false);

  // Initialize generation defaults from user preferences
  useEffect(() => {
    if (user?.preferences && !isSavingGeneration.current) {
      const initialTone = user.preferences.defaultToneLevel ?? 50;
      const initialDetail = user.preferences.defaultDetailLevel ?? 'brief';
      const initialTimePatterns = user.preferences.useTimePatterns ?? true;

      const preferencesChanged =
        lastSavedGenerationValues.current.toneLevel !== initialTone ||
        lastSavedGenerationValues.current.detailLevel !== initialDetail ||
        lastSavedGenerationValues.current.useTimePatterns !== initialTimePatterns;

      const shouldUpdate = !isGenerationInitialized || (preferencesChanged && !hasGenerationInteracted.current);

      if (shouldUpdate) {
        setToneLevel(initialTone);
        setDetailLevel(initialDetail);
        setUseTimePatterns(initialTimePatterns);
        lastSavedGenerationValues.current = {
          toneLevel: initialTone,
          detailLevel: initialDetail,
          useTimePatterns: initialTimePatterns
        };
        setIsGenerationInitialized(true);
        hasGenerationInteracted.current = false;
      }
    }
  }, [user?.id, user?.preferences, isGenerationInitialized]);

  // Calculate unsaved changes for generation defaults
  const hasUnsavedGenerationChanges = toneLevel !== lastSavedGenerationValues.current.toneLevel ||
                                     detailLevel !== lastSavedGenerationValues.current.detailLevel ||
                                     useTimePatterns !== lastSavedGenerationValues.current.useTimePatterns;

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
        resetWritingStyle(data);
      } else {
        toast.error(result.error || 'Failed to update writing style');
      }
    } catch (error) {
      toast.error('Failed to update writing style');
    } finally {
      setIsLoading(false);
    }
  };

  // Generation defaults handlers
  const handleToneChange = useCallback((newValue: number) => {
    if (isSavingGeneration.current) return;
    hasGenerationInteracted.current = true;
    setToneLevel(newValue);
  }, []);

  const handleDetailChange = useCallback((newValue: 'brief' | 'moderate' | 'detailed' | 'comprehensive') => {
    if (isSavingGeneration.current) return;
    hasGenerationInteracted.current = true;
    setDetailLevel(newValue);
  }, []);

  const handleTimePatternChange = useCallback((newValue: boolean) => {
    if (isSavingGeneration.current) return;
    hasGenerationInteracted.current = true;
    setUseTimePatterns(newValue);
  }, []);

  // Save generation defaults
  const saveGenerationDefaults = useCallback(async () => {
    if (!hasUnsavedGenerationChanges) {
      toast('No changes to save');
      return;
    }

    setIsLoading(true);
    isSavingGeneration.current = true;

    const savingToneLevel = toneLevel;
    const savingDetailLevel = detailLevel;
    const savingTimePatterns = useTimePatterns;

    try {
      const result = await userAPI.updateDefaultGenerationSettings({
        defaultToneLevel: savingToneLevel,
        defaultDetailLevel: savingDetailLevel,
        useTimePatterns: savingTimePatterns,
      });

      if (result.success) {
        lastSavedGenerationValues.current = {
          toneLevel: savingToneLevel,
          detailLevel: savingDetailLevel,
          useTimePatterns: savingTimePatterns
        };

        hasGenerationInteracted.current = false;

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
        });

        toast.success('Generation defaults saved successfully');
      } else {
        toast.error(result.error || 'Failed to save generation defaults');
      }
    } catch (error) {
      console.error('Save generation defaults error:', error);
      toast.error('Failed to save generation defaults');
    } finally {
      setIsLoading(false);
      isSavingGeneration.current = false;
    }
  }, [hasUnsavedGenerationChanges, toneLevel, detailLevel, useTimePatterns, user, updateUser, setIsLoading]);

  // Reset generation defaults to saved values
  const resetGenerationDefaults = useCallback(() => {
    hasGenerationInteracted.current = false;
    setToneLevel(lastSavedGenerationValues.current.toneLevel);
    setDetailLevel(lastSavedGenerationValues.current.detailLevel);
    setUseTimePatterns(lastSavedGenerationValues.current.useTimePatterns);
  }, []);

  // Detail level options
  const detailOptions: Array<{ value: 'brief' | 'moderate' | 'detailed' | 'comprehensive'; label: string; description: string }> = [
    { value: 'brief', label: 'Brief', description: 'Concise notes' },
    { value: 'moderate', label: 'Moderate', description: 'Balanced detail' },
    { value: 'detailed', label: 'Detailed', description: 'Comprehensive' },
    { value: 'comprehensive', label: 'Comprehensive', description: 'Maximum detail' },
  ];

  // Get tone description for smooth transitions
  const getToneDescription = (level: number): string => {
    if (level <= 10) return 'Maximum authenticity - pure personal style';
    if (level <= 25) return 'Mostly authentic with slight professional polish';
    if (level <= 40) return 'Authentic style with professional clarity';
    if (level <= 60) return 'Balanced blend of personal and professional';
    if (level <= 75) return 'Professional tone with personal touches';
    if (level <= 90) return 'Mostly professional with subtle authenticity';
    return 'Maximum professionalism - formal business style';
  };

  return (
    <div className="space-y-6">
      {/* Writing Style Sample Section */}
      <IntuitiveCard variant="default" padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <PencilIcon className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Writing Style Sample</h3>
              <p className="text-sm text-gray-600 mt-1">This sample helps AI match your authentic writing style</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {user?.writingStyle && (
              <Badge
                variant="success"
                style="subtle"
                size="sm"
                icon={<CheckCircleIcon className="h-3 w-3" />}
              >
                Configured
              </Badge>
            )}
            <IntuitiveButton
              variant={showWritingStyleForm ? "outline" : "primary"}
              size="md"
              onClick={() => setShowWritingStyleForm(!showWritingStyleForm)}
              icon={<PencilIcon />}
            >
              {showWritingStyleForm ? 'Cancel' : (user?.writingStyle ? 'Update Style' : 'Add Style')}
            </IntuitiveButton>
          </div>
        </div>

        {!showWritingStyleForm && user?.writingStyle && (
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-700 leading-relaxed">
              {user.writingStyle.length > 200
                ? `${user.writingStyle.substring(0, 200)}...`
                : user.writingStyle
              }
            </p>
            <div className="mt-2 text-xs text-gray-500">
              {user.writingStyle.length} characters
            </div>
          </div>
        )}

        {!showWritingStyleForm && !user?.writingStyle && (
          <div className="p-4 bg-amber-50 rounded-xl">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 mr-3" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">No writing style configured</p>
                <p className="text-amber-700">Add a writing sample to improve note generation quality</p>
              </div>
            </div>
          </div>
        )}

        {showWritingStyleForm && (
          <form onSubmit={handleSubmitWritingStyle(onSubmitWritingStyle)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Writing Style Sample (100-3000 characters)
              </label>
              <textarea
                {...registerWritingStyle('writingStyle')}
                rows={8}
                className={`w-full px-4 py-3 border rounded-xl shadow-card focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 resize-none ${
                  writingStyleErrors.writingStyle ? 'border-red-300 focus:ring-red-200 focus:border-red-500' : 'border-gray-300'
                }`}
                placeholder="Paste a sample of your professional writing here. This should represent your typical documentation style and tone..."
              />
              <div className="mt-2 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {writingStyleValue?.length || 0} / 3000 characters
                </div>
                {writingStyleErrors.writingStyle && (
                  <div className="flex items-center text-red-600 text-sm">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    {writingStyleErrors.writingStyle.message}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4">
              <IntuitiveButton
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                icon={<CheckCircleIcon />}
              >
                {isLoading ? 'Saving...' : 'Save Writing Style'}
              </IntuitiveButton>
            </div>
          </form>
        )}
      </IntuitiveCard>

      {/* Generation Defaults Section */}
      <IntuitiveCard variant="default" padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <DocumentTextIcon className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Note Generation Defaults</h3>
              <p className="text-sm text-gray-600 mt-1">Configure default settings for note generation</p>
            </div>
          </div>

          {hasUnsavedGenerationChanges && (
            <div className="flex items-center space-x-3">
              <Badge
                variant="warning"
                style="subtle"
                size="sm"
                icon={<ExclamationTriangleIcon className="h-3 w-3" />}
              >
                Unsaved Changes
              </Badge>
              <IntuitiveButton
                variant="outline"
                size="md"
                onClick={resetGenerationDefaults}
                disabled={isLoading}
              >
                Reset
              </IntuitiveButton>
              <IntuitiveButton
                variant="primary"
                size="md"
                onClick={saveGenerationDefaults}
                isLoading={isLoading}
                icon={<CheckCircleIcon />}
              >
                Save Changes
              </IntuitiveButton>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Tone Level Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Default Writing Tone
            </label>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
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
                  disabled={isSavingGeneration.current}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-primary-600">
                  {toneLevel}% Professional
                </div>
                <div className="text-xs text-gray-500 max-w-xs text-right">
                  {getToneDescription(toneLevel)}
                </div>
              </div>
            </div>
          </div>

          {/* Detail Level Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Default Detail Level
            </label>
            <div className="grid grid-cols-2 gap-3">
              {detailOptions.map((option) => (
                <IntuitiveButton
                  key={option.value}
                  variant={detailLevel === option.value ? "primary" : "outline"}
                  size="md"
                  onClick={() => handleDetailChange(option.value)}
                  disabled={isSavingGeneration.current}
                  className="h-auto p-4 text-left"
                >
                  <div>
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs opacity-75 mt-1">{option.description}</div>
                  </div>
                </IntuitiveButton>
              ))}
            </div>
          </div>

          {/* Time Patterns Toggle */}
          <div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
              <div>
                <h4 className="font-medium text-gray-900">Use Time Patterns</h4>
                <p className="text-sm text-gray-600 mt-1">Include time-based context in note generation</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useTimePatterns}
                  onChange={(e) => handleTimePatternChange(e.target.checked)}
                  className="sr-only peer"
                  disabled={isSavingGeneration.current}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
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
      </IntuitiveCard>
    </div>
  );
};

// ISP Tasks Settings Component
const ISPTasksSettings: React.FC<{
  ispTasks: ISPTask[];
  loadIspTasks: () => Promise<void>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}> = ({ ispTasks, loadIspTasks, isLoading, setIsLoading }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<ISPTask | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ISPTaskFormData>({
    resolver: zodResolver(ispTaskSchema),
    defaultValues: {
      description: '',
    },
  });

  const onSubmitTask = async (data: ISPTaskFormData) => {
    setIsLoading(true);
    try {
      let result;
      if (editingTask) {
        result = await ispTasksAPI.updateTask(editingTask.id, { description: data.description });
      } else {
        result = await ispTasksAPI.addTask(data.description);
      }

      if (result.success) {
        toast.success(editingTask ? 'Task updated successfully' : 'Task added successfully');
        await loadIspTasks();
        reset();
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

  const handleEditTask = (task: ISPTask) => {
    setEditingTask(task);
    setValue('description', task.description);
    setShowAddForm(true);
  };

  const handleDeleteTask = async (taskId: string) => {
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

  const handleCancelEdit = () => {
    setShowAddForm(false);
    setEditingTask(null);
    reset();
  };

  return (
    <div className="space-y-6">
      <IntuitiveCard variant="default" padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <DocumentTextIcon className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">ISP Tasks</h3>
              <p className="text-sm text-gray-600 mt-1">Manage your Individual Service Plan tasks</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Badge
              variant="info"
              style="subtle"
              size="sm"
            >
              {ispTasks.length} {ispTasks.length === 1 ? 'Task' : 'Tasks'}
            </Badge>
            <IntuitiveButton
              variant={showAddForm ? "outline" : "primary"}
              size="md"
              onClick={() => showAddForm ? handleCancelEdit() : setShowAddForm(true)}
              icon={showAddForm ? <TrashIcon /> : <PlusIcon />}
            >
              {showAddForm ? 'Cancel' : 'Add Task'}
            </IntuitiveButton>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <form onSubmit={handleSubmit(onSubmitTask)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingTask ? 'Edit Task Description' : 'Task Description'}
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-xl shadow-card focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 resize-none ${
                    errors.description ? 'border-red-300 focus:ring-red-200 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe the ISP task or goal..."
                />
                {errors.description && (
                  <div className="mt-1 flex items-center text-red-600 text-sm">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    {errors.description.message}
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <IntuitiveButton
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  icon={<CheckCircleIcon />}
                >
                  {isLoading ? 'Saving...' : (editingTask ? 'Update Task' : 'Add Task')}
                </IntuitiveButton>
                <IntuitiveButton
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </IntuitiveButton>
              </div>
            </form>
          </div>
        )}

        {/* Tasks List */}
        {ispTasks.length > 0 ? (
          <div className="space-y-3">
            {ispTasks.map((task, index) => (
              <div key={task.id} className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-600 rounded-full text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-500">Task {index + 1}</span>
                    </div>
                    <p className="text-gray-900 leading-relaxed">{task.description}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <IntuitiveButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTask(task)}
                      icon={<PencilIcon />}
                    >
                      Edit
                    </IntuitiveButton>
                    <IntuitiveButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                      icon={<TrashIcon />}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Delete
                    </IntuitiveButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No ISP Tasks</h4>
            <p className="text-gray-600 mb-4">Add your first Individual Service Plan task to get started</p>
            <IntuitiveButton
              variant="primary"
              size="md"
              onClick={() => setShowAddForm(true)}
              icon={<PlusIcon />}
            >
              Add Your First Task
            </IntuitiveButton>
          </div>
        )}
      </IntuitiveCard>
    </div>
  );
};

// Billing Settings Component
const BillingSettings: React.FC<{
  user: any;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}> = ({ user }) => {
  return (
    <div className="space-y-6">
      <IntuitiveCard variant="default" padding="lg">
        <div className="flex items-center space-x-4 mb-6">
          <CreditCardIcon className="w-6 h-6 text-primary-600" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Credits & Billing</h3>
            <p className="text-sm text-gray-600 mt-1">Manage your account credits and billing information</p>
          </div>
        </div>

        {/* Current Credits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="p-4 bg-green-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Available Credits</p>
                <p className="text-2xl font-bold text-green-900">{user?.credits || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CreditCardIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Credits Used</p>
                <p className="text-2xl font-bold text-blue-900">{user?.creditsUsed || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Billing Actions */}
        <div className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Purchase Additional Credits</h4>
                <p className="text-sm text-gray-600 mt-1">Buy more credits to continue generating notes</p>
              </div>
              <IntuitiveButton
                variant="primary"
                size="md"
                icon={<CreditCardIcon />}
                onClick={() => toast('Billing integration coming soon')}
              >
                Buy Credits
              </IntuitiveButton>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Billing History</h4>
                <p className="text-sm text-gray-600 mt-1">View your past transactions and invoices</p>
              </div>
              <IntuitiveButton
                variant="outline"
                size="md"
                icon={<DocumentTextIcon />}
                onClick={() => toast('Billing history coming soon')}
              >
                View History
              </IntuitiveButton>
            </div>
          </div>
        </div>
      </IntuitiveCard>
    </div>
  );
};

// Privacy Settings Component
const PrivacySettings: React.FC<{
  user: any;
  signOut: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}> = ({ user, signOut, isLoading, setIsLoading }) => {
  const handleExportData = async () => {
    try {
      toast('Data export feature coming soon');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    if (!confirm('This will permanently delete all your data. Are you absolutely sure?')) {
      return;
    }

    try {
      toast('Account deletion feature coming soon');
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  return (
    <div className="space-y-6">
      <IntuitiveCard variant="default" padding="lg">
        <div className="flex items-center space-x-4 mb-6">
          <ShieldCheckIcon className="w-6 h-6 text-primary-600" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Data & Privacy</h3>
            <p className="text-sm text-gray-600 mt-1">Export your data and manage privacy settings</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Data Export */}
          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Export Your Data</h4>
                <p className="text-sm text-gray-600 mt-1">Download all your notes and account data</p>
              </div>
              <IntuitiveButton
                variant="outline"
                size="md"
                icon={<CloudArrowDownIcon />}
                onClick={handleExportData}
              >
                Export Data
              </IntuitiveButton>
            </div>
          </div>

          {/* Account Deletion */}
          <div className="p-4 border border-red-200 rounded-xl bg-red-50">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-red-900">Delete Account</h4>
                <p className="text-sm text-red-700 mt-1">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <IntuitiveButton
                variant="outline"
                size="md"
                icon={<TrashIcon />}
                onClick={handleDeleteAccount}
                isLoading={isLoading}
                className="text-red-600 border-red-300 hover:bg-red-100"
              >
                Delete Account
              </IntuitiveButton>
            </div>
          </div>
        </div>
      </IntuitiveCard>
    </div>
  );
};

// Preferences Settings Component
const PreferencesSettings: React.FC<{
  user: any;
  updateUser: any;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}> = ({ user, updateUser, isLoading, setIsLoading }) => {
  const [preferences, setPreferences] = useState({
    emailNotifications: user?.emailNotifications ?? true,
    browserNotifications: user?.browserNotifications ?? false,
    darkMode: user?.darkMode ?? false,
    autoSave: user?.autoSave ?? true,
  });

  const handlePreferenceChange = async (key: string, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    setIsLoading(true);
    try {
      const result = await userAPI.updateProfile(newPreferences);
      if (result.success) {
        await updateUser({ ...user, ...newPreferences });
        toast.success('Preferences updated successfully');
      } else {
        // Revert on failure
        setPreferences(preferences);
        toast.error(result.error || 'Failed to update preferences');
      }
    } catch (error) {
      // Revert on failure
      setPreferences(preferences);
      toast.error('Failed to update preferences');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <IntuitiveCard variant="default" padding="lg">
        <div className="flex items-center space-x-4 mb-6">
          <CogIcon className="w-6 h-6 text-primary-600" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Preferences</h3>
            <p className="text-sm text-gray-600 mt-1">Customize your SwiftNotes experience</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Notifications */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <BellIcon className="w-5 h-5 mr-2 text-gray-600" />
              Notifications
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                <div>
                  <h5 className="font-medium text-gray-900">Email Notifications</h5>
                  <p className="text-sm text-gray-600">Receive updates and alerts via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                    className="sr-only peer"
                    disabled={isLoading}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                <div>
                  <h5 className="font-medium text-gray-900">Browser Notifications</h5>
                  <p className="text-sm text-gray-600">Show notifications in your browser</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.browserNotifications}
                    onChange={(e) => handlePreferenceChange('browserNotifications', e.target.checked)}
                    className="sr-only peer"
                    disabled={isLoading}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Interface */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <ComputerDesktopIcon className="w-5 h-5 mr-2 text-gray-600" />
              Interface
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                <div>
                  <h5 className="font-medium text-gray-900">Dark Mode</h5>
                  <p className="text-sm text-gray-600">Use dark theme for the interface</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.darkMode}
                    onChange={(e) => handlePreferenceChange('darkMode', e.target.checked)}
                    className="sr-only peer"
                    disabled={isLoading}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                <div>
                  <h5 className="font-medium text-gray-900">Auto-Save</h5>
                  <p className="text-sm text-gray-600">Automatically save your work</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.autoSave}
                    onChange={(e) => handlePreferenceChange('autoSave', e.target.checked)}
                    className="sr-only peer"
                    disabled={isLoading}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </IntuitiveCard>
    </div>
  );
};

export default IntuitiveProfilePage;
