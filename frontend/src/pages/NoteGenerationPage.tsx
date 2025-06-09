import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon, CogIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/authStore';
import { noteService } from '../services/noteService';
import { aiAPI } from '../services/apiService';
import EnhancedNoteSection from '../components/EnhancedNoteSection';
import CostIndicator from '../components/CostIndicator';
import type { ISPTask } from '../services/noteService';
import toast from 'react-hot-toast';

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
  // Add settings for Generate Notes alignment
  detailLevel?: string;
  toneLevel?: number;
}

const NoteGenerationPage: React.FC = () => {
  const { user } = useAuthStore();
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

  // const updateSectionContent = (index: number, content: string, isEdited: boolean) => {
  //   setSections(prev => prev.map((section, i) =>
  //     i === index ? { ...section, generated: content, isEdited } : section
  //   ));
  // };

  const updateSectionSettings = useCallback((index: number, settings: { detailLevel: string; toneLevel: number }) => {
    setSections(prev => prev.map((section, i) =>
      i === index ? { ...section, detailLevel: settings.detailLevel, toneLevel: settings.toneLevel } : section
    ));
  }, []);

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

      // Update sections with generated content (no database IDs)
      setSections(prev => prev.map(section => {
        const generatedSection = result.sections?.find((s: any) =>
          s.user_prompt === section.prompt.trim()
        );

        if (generatedSection && generatedSection.generated_content) {
          return {
            ...section,
            generated: generatedSection.generated_content,
            originalGenerated: generatedSection.generated_content,
            isEdited: false,
            tokensUsed: generatedSection.tokens_used || 0
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
        // Redirect to login after a short delay
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
      toast.error(error.message || 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  // const getTaskName = (taskId?: string) => {
  //   if (!taskId) return null;
  //   const task = ispTasks.find(t => t?.id === taskId);
  //   return task?.description || 'Unknown Task';
  // };

  const getTaskDescription = (taskId: string): string | undefined => {
    const task = ispTasks.find(t => t.id === taskId);
    return task?.description;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate Note</h1>
          <p className="text-gray-600">
            Create AI-powered notes based on your ISP tasks and custom prompts.
          </p>
        </div>

        {/* Setup Warning Banner */}
        {!user?.hasCompletedSetup && (
          <div className="mb-6 bg-warning-50 border border-warning-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-warning-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-warning-800">
                  Setup Required for Full Functionality
                </h3>
                <div className="mt-2 text-sm text-warning-700">
                  <p>
                    To use the preview functionality and generate notes, please complete your account setup
                    by adding your writing style and ISP tasks.
                  </p>
                </div>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <Link
                      to="/setup"
                      className="bg-warning-50 px-2 py-1.5 rounded-md text-sm font-medium text-warning-800 hover:bg-warning-100 inline-flex items-center"
                    >
                      <CogIcon className="h-4 w-4 mr-1" />
                      Complete Setup
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}



        <div className="bg-white shadow-sm rounded-lg p-6">
          {/* Note Title */}
          <div className="mb-6">
            <label htmlFor="noteTitle" className="block text-sm font-medium text-gray-700 mb-2">
              Note Title
            </label>
            <input
              type="text"
              id="noteTitle"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter a title for your note..."
            />
          </div>

          {/* Enhanced Sections */}
          <div className="space-y-6">
            {sections.map((section, index) => (
              <div key={index}>
                {/* Enhanced Note Section with Preview */}
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

          {/* Add Custom Section Button */}
          <div className="mt-6">
            <button
              onClick={addCustomSection}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Add Custom Section
            </button>
          </div>

          {/* Generate and Save Buttons */}
          <div className="mt-8 flex items-center justify-between">
            {/* User Credits Display */}
            <div className="text-sm text-gray-600">
              <span className="font-medium">{user?.credits || 0} credits available</span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Generate Button with Cost Indicator */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={generateNote}
                  disabled={isGenerating || !noteTitle.trim() || sections.every(s => !s.prompt.trim())}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Generate Note'
                  )}
                </button>

                {/* Cost Indicator for Generate Note */}
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

              {/* Save Note Button (only show after generation) */}
              {hasGeneratedContent && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={saveNote}
                    disabled={isSaving}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <BookmarkIcon className="h-5 w-5 mr-2" />
                        Save Note
                      </>
                    )}
                  </button>

                  <span className="text-sm text-gray-500">
                    Save to your notes history
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteGenerationPage;
