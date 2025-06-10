import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ExclamationTriangleIcon, 
  CogIcon, 
  PlusIcon,
  DocumentTextIcon,
  SparklesIcon,
  BookmarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/authStore';
import { noteService } from '../services/noteService';
import { aiAPI } from '../services/apiService';
import EnhancedNoteSection from '../components/EnhancedNoteSection';
import CostIndicator from '../components/CostIndicator';
import type { ISPTask } from '../services/noteService';
import toast from 'react-hot-toast';

// Import our intuitive components
import IntuitiveCard, { ActionCard } from '../components/intuitive/IntuitiveCard';
import IntuitiveButton from '../components/intuitive/IntuitiveButton';

interface SectionData {
  taskId?: string;
  prompt: string;
  type: 'task' | 'comment' | 'general';
  generated?: string;
  isGenerating?: boolean;
  sectionId?: string;
  originalGenerated?: string;
  isEdited?: boolean;
  generationTime?: number;
  tokensUsed?: number;
  detailLevel?: string;
  toneLevel?: number;
}

const IntuitiveNoteGenerationPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [ispTasks, setIspTasks] = useState<ISPTask[]>([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [sections, setSections] = useState<SectionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasGeneratedContent, setHasGeneratedContent] = useState(false);
  const [freeGenerationsRemaining, setFreeGenerationsRemaining] = useState(2);
  const [, setGeneratedNoteId] = useState<string | null>(null);

  // Memoize calculateFreeGenerations to prevent infinite re-renders
  const calculateFreeGenerations = useCallback(() => {
    if (!user) return;
    const freeGenerationsUsed = user.freeGenerationsUsed || 0;
    const remaining = Math.max(0, 2 - freeGenerationsUsed);
    setFreeGenerationsRemaining(remaining);
  }, [user?.freeGenerationsUsed]);

  const loadISPTasks = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const tasks = await noteService.getUserISPTasks();
      setIspTasks(tasks);

      // Initialize sections with ISP tasks
      const initialSections: SectionData[] = tasks
        .filter(task => task?.id)
        .map(task => ({
          taskId: task.id,
          prompt: '',
          type: 'task' as const
        }));

      // Add a general comment section
      initialSections.push({
        prompt: '',
        type: 'comment' as const
      });

      setSections(initialSections);
    } catch (error) {
      console.error('Error loading ISP tasks:', error);
      toast.error('Failed to load ISP tasks');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Load user's ISP tasks on component mount
  useEffect(() => {
    if (user?.id) {
      loadISPTasks();
    }
  }, [user?.id, loadISPTasks]);

  // Calculate free generations separately when user data changes
  useEffect(() => {
    if (user?.id) {
      calculateFreeGenerations();
    }
  }, [user?.id, user?.freeGenerationsUsed]);

  const updateSectionPrompt = useCallback((index: number, prompt: string) => {
    setSections(prev => prev.map((section, i) =>
      i === index ? { ...section, prompt } : section
    ));
  }, []);

  const addCustomSection = () => {
    setSections(prev => [...prev, {
      prompt: '',
      type: 'general'
    }]);
  };

  const removeSection = useCallback((index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateSectionSettings = useCallback((index: number, settings: { detailLevel: string; toneLevel: number }) => {
    setSections(prev => prev.map((section, i) =>
      i === index ? { ...section, detailLevel: settings.detailLevel, toneLevel: settings.toneLevel } : section
    ));
  }, []);

  const getTaskDescription = (taskId: string): string => {
    const task = ispTasks.find(t => t.id === taskId);
    return task?.description || 'Unknown task';
  };

  const generateNote = async () => {
    if (!user?.id || !user.writingStyle) {
      toast.error('Please complete your setup first');
      return;
    }

    if (!noteTitle.trim()) {
      toast.error('Please enter a note title');
      return;
    }

    const validSections = sections.filter(section => section.prompt.trim());
    if (validSections.length === 0) {
      toast.error('Please add at least one section with content');
      return;
    }

    // Check if user has sufficient credits or free generations
    const needsCredits = freeGenerationsRemaining === 0;
    if (needsCredits && user.credits < 1) {
      toast.error('Insufficient credits. You need 1 credit to generate a note.');
      return;
    }

    try {
      setIsGenerating(true);

      // Generate note without saving (saveNote: false)
      const result = await aiAPI.generateNote({
        title: noteTitle.trim(),
        sections: validSections.map(section => ({
          taskId: section.taskId,
          prompt: section.prompt.trim(),
          type: section.type,
          detailLevel: section.detailLevel || 'brief',
          toneLevel: section.toneLevel || 50
        })),
        saveNote: false // Don't save automatically
      });

      if (result.success && result.sections) {
        // Update sections with generated content
        setSections(prev => prev.map((section, index) => {
          const generatedSection = result.sections[index];
          if (generatedSection && section.prompt.trim()) {
            return {
              ...section,
              generated: generatedSection.generated_content,
              tokensUsed: generatedSection.tokens_used,
              generationTime: generatedSection.generationTime,
              isGenerating: false
            };
          }
          return section;
        }));

        setHasGeneratedContent(true);

        // Update user credits and free generations in store
        const creditsUsed = result.creditsUsed || 0;
        const usedFreeGeneration = result.usedFreeGeneration || false;
        const newFreeGenerationsRemaining = result.freeGenerationsRemaining || 0;

        if (usedFreeGeneration) {
          toast.success(`Note generated successfully! Used 1 free generation (${newFreeGenerationsRemaining} remaining).`);
          setFreeGenerationsRemaining(newFreeGenerationsRemaining);
          useAuthStore.getState().updateUser({
            freeGenerationsUsed: (user.freeGenerationsUsed || 0) + 1
          });
        } else {
          toast.success(`Note generated successfully! Used ${creditsUsed} credits.`);
          useAuthStore.getState().updateUser({
            credits: user.credits - creditsUsed
          });
        }
      }
    } catch (error: any) {
      console.error('Error generating note:', error);
      
      // Handle specific error types with appropriate user feedback
      if (error.message.includes('Insufficient credits')) {
        toast.error('Insufficient credits. Please purchase more credits to continue.');
      } else if (error.code === 'PROFILE_FETCH_ERROR') {
        if (error.retryable) {
          toast.error('Unable to load your profile. Please refresh the page and try again.', {
            duration: 6000
          });
        } else {
          toast.error('Profile data error. Please contact support if this persists.', {
            duration: 8000
          });
        }
      } else if (error.code === 'PROFILE_NOT_FOUND') {
        toast.error('Your profile was not found. Please try logging out and back in.', {
          duration: 6000
        });
      } else if (error.code === 'TOKEN_EXPIRED' || error.code === 'INVALID_TOKEN') {
        toast.error('Your session has expired. Please log in again.', {
          duration: 6000
        });
        setTimeout(() => {
          useAuthStore.getState().signOut();
        }, 2000);
      } else if (error.code === 'AUTH_SERVICE_ERROR') {
        toast.error('Authentication service is temporarily unavailable. Please try again in a moment.', {
          duration: 6000
        });
      } else if (error.message.includes('setup')) {
        toast.error('Please complete your setup before generating notes.', {
          duration: 5000
        });
      } else {
        toast.error(error.message || 'Failed to generate note. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const saveNote = async () => {
    if (!hasGeneratedContent) {
      toast.error('Please generate a note first');
      return;
    }

    const sectionsWithContent = sections.filter(section => section.generated);
    if (sectionsWithContent.length === 0) {
      toast.error('No generated content to save');
      return;
    }

    try {
      setIsSaving(true);

      const result = await aiAPI.saveNote({
        title: noteTitle.trim(),
        sections: sectionsWithContent.map(section => ({
          isp_task_id: section.taskId || null,
          user_prompt: section.prompt,
          generated_content: section.generated!,
          tokens_used: section.tokensUsed || 0,
          is_edited: section.isEdited || false
        }))
      });

      if (result.success) {
        toast.success('Note saved successfully!');
        setGeneratedNoteId(result.note.id);

        // Update sections with database IDs
        setSections(prev => prev.map((section, index) => {
          const savedSection = result.note.sections[index];
          if (savedSection && section.generated) {
            return {
              ...section,
              sectionId: savedSection.id
            };
          }
          return section;
        }));
      }
    } catch (error: any) {
      console.error('Error saving note:', error);
      toast.error(error.message || 'Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <IntuitiveCard variant="subtle" padding="lg" loading>
          <div className="h-8 w-1/3 mb-4"></div>
          <div className="h-4 w-2/3"></div>
        </IntuitiveCard>
        
        <IntuitiveCard padding="lg" loading>
          <div className="space-y-4">
            <div className="h-32"></div>
            <div className="h-32"></div>
            <div className="h-32"></div>
          </div>
        </IntuitiveCard>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Page Header */}
      <IntuitiveCard variant="subtle" padding="lg">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <SparklesIcon className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate Note</h1>
            <p className="text-gray-600 text-lg">
              Create AI-powered notes based on your ISP tasks and custom prompts.
            </p>
          </div>
        </div>
      </IntuitiveCard>

      {/* Setup Warning Banner */}
      {!user?.hasCompletedSetup && (
        <IntuitiveCard variant="interactive" padding="lg">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Setup Required for Full Functionality
              </h3>
              <p className="text-gray-600 mb-4">
                To use the preview functionality and generate notes, please complete your account setup
                by adding your writing style and ISP tasks.
              </p>
              <IntuitiveButton
                variant="primary"
                size="md"
                onClick={() => navigate('/setup')}
                icon={<CogIcon />}
              >
                Complete Setup
              </IntuitiveButton>
            </div>
          </div>
        </IntuitiveCard>
      )}

      {/* Main Note Generation Form */}
      <IntuitiveCard variant="default" padding="lg">
        {/* Note Title Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <DocumentTextIcon className="w-5 h-5 text-primary-600" />
            <label htmlFor="noteTitle" className="text-lg font-semibold text-gray-900">
              Note Title
            </label>
          </div>
          <input
            type="text"
            id="noteTitle"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-card focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 text-lg"
            placeholder="Enter a descriptive title for your note..."
          />
        </div>

        {/* Sections */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Note Sections</h3>
            <span className="text-sm text-gray-500">
              {sections.filter(s => s.prompt.trim()).length} of {sections.length} sections have content
            </span>
          </div>

          {sections.map((section, index) => (
            <div key={index} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <EnhancedNoteSection
                index={index}
                section={section}
                taskDescription={section.taskId ? getTaskDescription(section.taskId) : undefined}
                onPromptChange={(prompt) => updateSectionPrompt(index, prompt)}
                onRemove={section.type !== 'task' ? () => removeSection(index) : undefined}
                onSettingsChange={(settings: { detailLevel: string; toneLevel: number }) => updateSectionSettings(index, settings)}
              />
            </div>
          ))}
        </div>

        {/* Add Custom Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <IntuitiveButton
            variant="outline"
            size="md"
            onClick={addCustomSection}
            icon={<PlusIcon />}
            className="w-full sm:w-auto"
          >
            Add Custom Section
          </IntuitiveButton>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            {/* Credits Display */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{user?.credits || 0} credits available</span>
              </div>
              <CostIndicator
                cost={freeGenerationsRemaining > 0 ? 'Free' : 1}
                type={freeGenerationsRemaining > 0 ? 'free' : 'credits'}
                remaining={freeGenerationsRemaining}
                total={2}
                tooltip={
                  freeGenerationsRemaining > 0
                    ? `You have ${freeGenerationsRemaining} free generations remaining. After that, each generation costs 1 credit.`
                    : 'Each note generation costs 1 credit. You get 2 free generations per credit.'
                }
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <IntuitiveButton
                variant="primary"
                size="lg"
                onClick={generateNote}
                isLoading={isGenerating}
                disabled={!noteTitle.trim() || sections.every(s => !s.prompt.trim())}
                icon={<SparklesIcon />}
                className="min-w-[140px]"
              >
                {isGenerating ? 'Generating...' : 'Generate Note'}
              </IntuitiveButton>

              {hasGeneratedContent && (
                <IntuitiveButton
                  variant="success"
                  size="lg"
                  onClick={saveNote}
                  isLoading={isSaving}
                  icon={<BookmarkIcon />}
                  className="min-w-[120px]"
                >
                  {isSaving ? 'Saving...' : 'Save Note'}
                </IntuitiveButton>
              )}
            </div>
          </div>
        </div>
      </IntuitiveCard>

      {/* Quick Actions for Generated Content */}
      {hasGeneratedContent && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActionCard
            title="View Notes History"
            description="Browse and manage your previously generated notes"
            action="View history"
            icon={<ClockIcon className="w-6 h-6" />}
            onClick={() => navigate('/notes')}
          />

          <ActionCard
            title="Generate Another Note"
            description="Create a new note with different content"
            action="Start fresh"
            icon={<PlusIcon className="w-6 h-6" />}
            onClick={() => {
              setNoteTitle('');
              setSections(prev => prev.map(section => ({ ...section, prompt: '', generated: undefined })));
              setHasGeneratedContent(false);
            }}
          />

          <ActionCard
            title="Adjust Settings"
            description="Modify your writing style and preferences"
            action="Go to setup"
            icon={<CogIcon className="w-6 h-6" />}
            onClick={() => navigate('/setup')}
          />
        </div>
      )}
    </div>
  );
};

export default IntuitiveNoteGenerationPage;
