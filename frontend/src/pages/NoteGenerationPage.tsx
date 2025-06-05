import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon, CogIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/authStore';
import { noteService } from '../services/noteService';
// TEMPORARILY DISABLED - import writingAnalyticsService from '../services/writingAnalyticsService';
import EditableNoteSection from '../components/EditableNoteSection';
import EnhancedNoteSection from '../components/EnhancedNoteSection';
// TEMPORARILY DISABLED - import WritingStyleConfidence from '../components/WritingStyleConfidence';
import type { ISPTask, GenerateNoteRequest } from '../services/noteService';
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
}

const NoteGenerationPage: React.FC = () => {
  const { user } = useAuthStore();
  const [ispTasks, setIspTasks] = useState<ISPTask[]>([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [sections, setSections] = useState<SectionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNoteId, setGeneratedNoteId] = useState<string | null>(null);

  // Load user's ISP tasks on component mount
  useEffect(() => {
    if (user?.id) {
      loadISPTasks();
    }
  }, [user?.id]);

  const loadISPTasks = async () => {
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
  };

  const updateSectionPrompt = (index: number, prompt: string) => {
    setSections(prev => prev.map((section, i) =>
      i === index ? { ...section, prompt } : section
    ));
  };

  const addCustomSection = () => {
    setSections(prev => [...prev, {
      prompt: '',
      type: 'general'
    }]);
  };

  const removeSection = (index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index));
  };

  const updateSectionContent = (index: number, content: string, isEdited: boolean) => {
    setSections(prev => prev.map((section, i) =>
      i === index ? { ...section, generated: content, isEdited } : section
    ));
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

    try {
      setIsGenerating(true);

      const request: GenerateNoteRequest = {
        title: noteTitle.trim(),
        sections: validSections.map(section => ({
          taskId: section.taskId,
          prompt: section.prompt.trim(),
          type: section.type
        }))
      };

      const result = await noteService.generateNote(request);

      // Store the generated note ID for analytics
      if (result?.note?.id) {
        setGeneratedNoteId(result.note.id);
      }

      // Update sections with generated content and analytics data
      setSections(prev => prev.map(section => {
        const generatedSection = result.sections?.find(s =>
          s.user_prompt === section.prompt.trim()
        );

        if (generatedSection?.id && generatedSection.generated_content) {
          return {
            ...section,
            generated: generatedSection.generated_content,
            sectionId: generatedSection.id,
            originalGenerated: generatedSection.generated_content,
            isEdited: false,
            tokensUsed: generatedSection.tokens_used || 0
          };
        }

        return section;
      }));

      toast.success(`Note generated successfully! Used ${result.creditsUsed} credits.`);

      // Update user credits in store
      if (user.credits !== undefined) {
        useAuthStore.getState().updateUser({
          credits: user.credits - result.creditsUsed
        });
      }

    } catch (error: any) {
      console.error('Error generating note:', error);
      toast.error(error.message || 'Failed to generate note');
    } finally {
      setIsGenerating(false);
    }
  };

  const getTaskName = (taskId?: string) => {
    if (!taskId) return null;
    const task = ispTasks.find(t => t?.id === taskId);
    return task?.description || 'Unknown Task';
  };

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

        {/* TEMPORARILY DISABLED - Writing Style Confidence Indicator */}
        {/* <div className="mb-6">
          <WritingStyleConfidence className="max-w-md" />
        </div> */}

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
                />

                {/* Generated Content with Analytics (shown after generation) */}
                {section.generated && section.sectionId && (
                  <div className="mt-4">
                    <EditableNoteSection
                      sectionId={section.sectionId}
                      noteId={generatedNoteId || ''}
                      content={section.generated}
                      originalContent={section.originalGenerated || section.generated}
                      isEdited={section.isEdited || false}
                      onContentChange={(newContent, isEdited) => {
                        updateSectionContent(index, newContent, isEdited);
                      }}
                      onAnalyticsUpdate={() => {
                        // Refresh analytics data if needed
                        console.log('Analytics updated for section:', section.sectionId);
                      }}
                    />
                  </div>
                )}
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

          {/* Generate Button */}
          <div className="mt-8 flex justify-end">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteGenerationPage;
