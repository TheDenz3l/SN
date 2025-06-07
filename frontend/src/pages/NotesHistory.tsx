import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { notesAPI, userAPI, ispTasksAPI, aiAPI } from '../services/apiService';
import {
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  FunnelIcon,
  CheckIcon,
  ArrowDownTrayIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ClipboardDocumentIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Note {
  id: string;
  title: string;
  content: any;
  note_type: string;
  tokens_used?: number;
  cost?: number;
  created_at: string;
  updated_at: string;
  sections?: Array<{
    id: string;
    user_prompt: string;
    generated_content: string;
    is_edited: boolean;
    tokens_used?: number;
    created_at: string;
    isp_task_id?: string | null;
  }>;
}

interface ISPTask {
  id: string;
  description: string;
  structured_data?: any;
}

interface NotesResponse {
  success: boolean;
  notes: Note[];
  total: number;
  page: number;
  totalPages: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    search: string;
    noteType: string;
    sortBy: string;
    sortOrder: string;
    startDate?: string;
    endDate?: string;
  };
  error?: string;
}

interface UsageStats {
  totalNotes?: number;
  totalTokens?: number;
  totalCost?: number;
  recentNotes?: number;
  weeklyNotes?: number;
  todayNotes?: number;
  averageTokensPerNote?: number;
  averageCostPerNote?: number;
  totalTimeSavedHours?: number;
  noteTypeDistribution?: Record<string, number>;
  monthlyBreakdown?: Array<{
    month: string;
    notes: number;
    tokens: number;
    cost: number;
  }>;
}

// Helper function to attempt legacy note migration
const attemptLegacyNoteMigration = async (noteId: string, legacyContent: any): Promise<boolean> => {
  try {
    // Only attempt migration if we have meaningful content to migrate
    if (!legacyContent || typeof legacyContent !== 'object') {
      return false;
    }

    // Check if there's content that can be migrated
    const migratableContent = legacyContent.content || legacyContent.text || legacyContent.body;
    if (!migratableContent || typeof migratableContent !== 'string') {
      return false;
    }

    console.log('🔄 Attempting to migrate legacy note:', noteId);

    // Create a section from the legacy content
    const migrationSection = {
      isp_task_id: null,
      user_prompt: 'Migrated from legacy format',
      generated_content: migratableContent,
      tokens_used: 0,
      is_edited: false
    };

    // Use the AI API to save the migrated note
    const response = await aiAPI.saveNote({
      title: `Migrated Note ${noteId.substring(0, 8)}`,
      sections: [migrationSection]
    });

    if (response && response.note) {
      console.log('✅ Successfully migrated legacy note');
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Failed to migrate legacy note:', error);
    return false;
  }
};

// Enhanced Note Content Display Component with ISP Task Source, Copy Buttons, and Editing
const EnhancedNoteContentDisplay: React.FC<{ selectedNote: Note }> = ({ selectedNote }) => {
  const [ispTasks, setIspTasks] = useState<{ [key: string]: ISPTask }>({});
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [editingSections, setEditingSections] = useState<{ [key: string]: boolean }>({});
  const [editedContent, setEditedContent] = useState<{ [key: string]: string }>({});
  const [copyFeedback, setCopyFeedback] = useState<{ [key: string]: string | null }>({});
  const [migrating, setMigrating] = useState(false);

  // DEBUG: Log the note data to help identify issues
  console.log('🔍 EnhancedNoteContentDisplay - Note Data:', {
    noteId: selectedNote.id,
    title: selectedNote.title,
    hasSections: !!(selectedNote.sections && selectedNote.sections.length > 0),
    sectionsCount: selectedNote.sections ? selectedNote.sections.length : 0,
    sectionsData: selectedNote.sections,
    hasLegacyContent: !!(selectedNote.content && typeof selectedNote.content === 'object' && selectedNote.content.sections),
    contentData: selectedNote.content,
    contentType: typeof selectedNote.content,
    rawNote: selectedNote
  });

  // ENHANCED DEBUG: Log the exact conditions being checked
  console.log('🔍 ENHANCED DEBUG - Condition Checks:', {
    'Priority 1 - Has Sections': selectedNote.sections && selectedNote.sections.length > 0,
    'Priority 2 - Legacy Content': selectedNote.content && typeof selectedNote.content === 'object' && (!selectedNote.sections || selectedNote.sections.length === 0),
    'Priority 3 - String Content': typeof selectedNote.content === 'string',
    'Priority 4 - Other Content': !!selectedNote.content,
    'Final Fallback': !selectedNote.content
  });

  // Fetch ISP tasks for sections that have isp_task_id
  useEffect(() => {
    const fetchISPTasks = async () => {
      if (!selectedNote.sections) return;

      const taskIds = selectedNote.sections
        .filter(section => section.isp_task_id)
        .map(section => section.isp_task_id!)
        .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

      if (taskIds.length === 0) return;

      try {
        const result = await ispTasksAPI.getTasks();
        const tasksMap: { [key: string]: ISPTask } = {};

        if (result.tasks) {
          result.tasks.forEach((task: ISPTask) => {
            if (taskIds.includes(task.id)) {
              tasksMap[task.id] = task;
            }
          });
        }

        setIspTasks(tasksMap);
      } catch (error) {
        console.error('Failed to fetch ISP tasks:', error);
      }
    };

    fetchISPTasks();
  }, [selectedNote.sections]);

  // Handle copy functionality
  const handleCopyContent = async (content: string, sectionId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyFeedback(prev => ({ ...prev, [sectionId]: 'Copied!' }));
      setTimeout(() => {
        setCopyFeedback(prev => ({ ...prev, [sectionId]: null }));
      }, 2000);
    } catch (err) {
      setCopyFeedback(prev => ({ ...prev, [sectionId]: 'Failed to copy' }));
      setTimeout(() => {
        setCopyFeedback(prev => ({ ...prev, [sectionId]: null }));
      }, 2000);
    }
  };

  // Handle section editing
  const startEditing = (sectionId: string, currentContent: string) => {
    setEditingSections(prev => ({ ...prev, [sectionId]: true }));
    setEditedContent(prev => ({ ...prev, [sectionId]: currentContent }));
  };

  const cancelEditing = (sectionId: string) => {
    setEditingSections(prev => ({ ...prev, [sectionId]: false }));
    setEditedContent(prev => ({ ...prev, [sectionId]: '' }));
  };

  const saveEditing = async (sectionId: string) => {
    const newContent = editedContent[sectionId];
    if (!newContent || newContent.trim() === '') {
      toast.error('Content cannot be empty');
      return;
    }

    try {
      // Call API to update note section
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/notes/sections/${sectionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generated_content: newContent.trim(),
          is_edited: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update section');
      }

      // Update the local state
      if (selectedNote.sections) {
        const sectionIndex = selectedNote.sections.findIndex(s => s.id === sectionId);
        if (sectionIndex !== -1) {
          selectedNote.sections[sectionIndex].generated_content = newContent.trim();
          selectedNote.sections[sectionIndex].is_edited = true;
        }
      }

      setEditingSections(prev => ({ ...prev, [sectionId]: false }));
      setEditedContent(prev => ({ ...prev, [sectionId]: '' }));
      toast.success('Content updated successfully');
    } catch (error) {
      console.error('Failed to save content:', error);
      toast.error('Failed to save content');
    }
  };

  // Toggle ISP task source visibility
  const toggleISPTaskSource = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Handle legacy note migration
  const handleMigrateLegacyNote = async () => {
    if (!selectedNote.content || typeof selectedNote.content !== 'object') {
      toast.error('No content available to migrate');
      return;
    }

    setMigrating(true);
    try {
      const success = await attemptLegacyNoteMigration(selectedNote.id, selectedNote.content);
      if (success) {
        toast.success('Note migrated successfully! Please refresh the page to see the updated note.');
      } else {
        toast.error('Unable to migrate this note - no suitable content found');
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Failed to migrate note');
    } finally {
      setMigrating(false);
    }
  };

  // PRIORITY 1: If note has sections array (new format) - this should be checked FIRST
  console.log('🔍 Checking PRIORITY 1: sections array', {
    hasSections: !!(selectedNote.sections && selectedNote.sections.length > 0),
    sections: selectedNote.sections
  });

  if (selectedNote.sections && selectedNote.sections.length > 0) {
    console.log('✅ PRIORITY 1 MET: Displaying NEW FORMAT with sections');
    return (
      <div className="space-y-6">
        {selectedNote.sections.map((section, index) => (
          <div key={section.id} className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-semibold text-gray-900">
                Section {index + 1}
              </h5>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                {section.tokens_used && (
                  <span className="px-2 py-1 bg-gray-100 rounded">{section.tokens_used} tokens</span>
                )}
                {section.is_edited && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                    Edited
                  </span>
                )}
              </div>
            </div>

            {/* ISP Task Source Section */}
            {section.isp_task_id && ispTasks[section.isp_task_id] && (
              <div className="mb-4">
                <button
                  onClick={() => toggleISPTaskSource(section.id)}
                  className="flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
                >
                  {expandedSections[section.id] ? (
                    <ChevronDownIcon className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronRightIcon className="h-3 w-3 mr-1" />
                  )}
                  ISP Task Source
                </button>

                {expandedSections[section.id] && (
                  <div className="text-sm text-gray-700 bg-indigo-50 p-3 rounded border-l-4 border-indigo-400 mb-3">
                    <p className="font-medium text-indigo-900 mb-1">Original ISP Task:</p>
                    <p className="text-indigo-800">{ispTasks[section.isp_task_id].description}</p>
                    {ispTasks[section.isp_task_id].structured_data && (
                      <div className="mt-2 text-xs text-indigo-700">
                        <p className="font-medium">Additional Context:</p>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {JSON.stringify(ispTasks[section.isp_task_id].structured_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* User Prompt Section */}
            {section.user_prompt && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-600 mb-2">User Prompt:</p>
                <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                  {section.user_prompt}
                </div>
              </div>
            )}

            {/* Generated Content Section with Copy and Edit */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Generated Content:</p>

              {editingSections[section.id] ? (
                // Editing Mode
                <div className="space-y-3">
                  <textarea
                    value={editedContent[section.id] || section.generated_content}
                    onChange={(e) => setEditedContent(prev => ({ ...prev, [section.id]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 resize-none"
                    rows={Math.max(3, (editedContent[section.id] || section.generated_content).split('\n').length)}
                    placeholder="Edit your content..."
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => cancelEditing(section.id)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveEditing(section.id)}
                      className="px-3 py-1 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                // Display Mode with Copy and Edit buttons
                <div className="relative group bg-gray-50 rounded-md p-3 border border-gray-200">
                  <div className="whitespace-pre-wrap text-gray-900 text-sm pr-20">
                    {section.generated_content || 'No content generated'}
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute top-3 right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button
                      onClick={() => handleCopyContent(section.generated_content || '', section.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white hover:shadow-sm rounded z-10"
                      title={copyFeedback[section.id] || "Copy content"}
                    >
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => startEditing(section.id, section.generated_content || '')}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white hover:shadow-sm rounded z-10"
                      title="Edit content"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Copy Feedback */}
                  {copyFeedback[section.id] && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-20">
                      {copyFeedback[section.id]}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // PRIORITY 2: Handle legacy content more gracefully
  console.log('🔍 Checking PRIORITY 2: legacy content', {
    hasContent: !!selectedNote.content,
    isObject: typeof selectedNote.content === 'object',
    hasLegacySections: !!(selectedNote.content && typeof selectedNote.content === 'object' && selectedNote.content.sections),
    noSectionsArray: !selectedNote.sections || selectedNote.sections.length === 0,
    content: selectedNote.content
  });

  // Check if this is a legacy note with content object but no sections array
  if (selectedNote.content &&
      typeof selectedNote.content === 'object' &&
      (!selectedNote.sections || selectedNote.sections.length === 0)) {

    console.log('🔍 Handling legacy content format');

    // Try to extract meaningful content from legacy format
    const legacyContent = selectedNote.content;

    // Check if there's actual content data in the legacy format
    if (legacyContent.sections && typeof legacyContent.sections === 'number') {
      // This is just a section count, not actual content
      console.log('⚠️ Legacy format with section count only');
      return (
        <div className="space-y-4">
          <div className="text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
            <p className="font-medium">Legacy Note Format</p>
            <p className="text-sm mt-1">
              This note was created in an older format and indicates it had {legacyContent.sections} section{legacyContent.sections !== 1 ? 's' : ''},
              but the actual content data is not available in the current format.
            </p>
          </div>
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> This appears to be a note that was created but may not have been fully saved or migrated.
              The content may be available in the original note creation context.
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <p className="text-gray-700 text-sm mb-2">
              <strong>Troubleshooting:</strong> If this note should contain content, it may be stored in a legacy format that needs manual review.
              Check the raw data below or contact support if you believe this note should have content.
            </p>
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-800">Show raw data</summary>
              <pre className="mt-2 p-2 bg-white rounded border text-gray-700 overflow-x-auto">
                {JSON.stringify(selectedNote.content, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    // Check if there are other content fields we can display
    if (legacyContent.content || legacyContent.text || legacyContent.body) {
      const displayContent = legacyContent.content || legacyContent.text || legacyContent.body;
      console.log('📄 Found legacy content field to display');
      return (
        <div className="space-y-4">
          <div className="text-blue-700 bg-blue-50 p-3 rounded border border-blue-200 flex items-center justify-between">
            <div>
              <p className="font-medium">Legacy Note Content</p>
              <p className="text-sm mt-1">This note uses an older format but contains readable content.</p>
            </div>
            <button
              onClick={handleMigrateLegacyNote}
              disabled={migrating}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {migrating ? 'Migrating...' : 'Migrate Note'}
            </button>
          </div>
          <div className="bg-white p-4 rounded border shadow-sm">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {typeof displayContent === 'string' ? displayContent : JSON.stringify(displayContent, null, 2)}
            </div>
          </div>
        </div>
      );
    }

    // If we have other structured data, try to display it meaningfully
    const contentKeys = Object.keys(legacyContent).filter(key => key !== 'sections');
    if (contentKeys.length > 0) {
      console.log('📊 Displaying structured legacy content');
      return (
        <div className="space-y-4">
          <div className="text-blue-700 bg-blue-50 p-3 rounded border border-blue-200">
            <p className="font-medium">Legacy Note Data</p>
            <p className="text-sm mt-1">This note contains structured data from an older format.</p>
          </div>
          <div className="space-y-3">
            {contentKeys.map(key => (
              <div key={key} className="bg-white p-3 rounded border">
                <div className="text-sm font-medium text-gray-600 mb-2 capitalize">
                  {key.replace(/_/g, ' ')}:
                </div>
                <div className="text-gray-700">
                  {typeof legacyContent[key] === 'string' ? (
                    <div className="whitespace-pre-wrap">{legacyContent[key]}</div>
                  ) : (
                    <pre className="text-xs whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(legacyContent[key], null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Fallback for completely unrecognized legacy format
    console.log('⚠️ Unrecognized legacy format - showing raw data');
    return (
      <div className="space-y-4">
        <div className="text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
          <p className="font-medium">Unrecognized Note Format</p>
          <p className="text-sm mt-1">This note contains data in an unrecognized format.</p>
        </div>
        <div className="bg-white p-3 rounded border">
          <div className="text-sm text-gray-600 mb-2">Raw data:</div>
          <pre className="text-gray-700 text-sm whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(selectedNote.content, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  // If content is a string
  console.log('🔍 Checking string content condition');
  if (typeof selectedNote.content === 'string') {
    console.log('📄 Displaying string content');
    return (
      <div className="bg-white p-4 rounded border shadow-sm">
        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
          {selectedNote.content}
        </div>
      </div>
    );
  }

  // If content exists but is some other format
  console.log('🔍 Checking other content format condition');
  if (selectedNote.content) {
    console.log('📊 Displaying raw content data');
    return (
      <div className="space-y-4">
        <div className="text-gray-700 bg-gray-100 p-3 rounded">
          <p className="font-medium mb-2">Raw Content Data:</p>
          <pre className="text-xs whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(selectedNote.content, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  // No content available
  console.log('❓ No content available - displaying default message');
  return (
    <div className="text-center py-8 text-gray-500">
      <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300 mb-2" />
      <p>No content available for this note</p>
    </div>
  );
};

// Original component for backward compatibility
const NoteContentDisplay: React.FC<{ selectedNote: Note }> = ({ selectedNote }) => {
  return <EnhancedNoteContentDisplay selectedNote={selectedNote} />;
};

const NotesHistoryPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loadingNoteDetails, setLoadingNoteDetails] = useState(false);

  // Filter and sorting states
  const [noteType, setNoteType] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Bulk operations states
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const itemsPerPage = 10;

  useEffect(() => {
    if (user?.id && isAuthenticated) {
      loadNotes();
      loadUsageStats();
    }
  }, [user?.id, isAuthenticated, currentPage, searchTerm, noteType, sortBy, sortOrder, startDate, endDate]);

  const loadNotes = async () => {
    try {
      setLoading(true);

      // Check authentication before making request
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Authentication required. Please log in again.');
        return;
      }

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm.trim() || undefined,
        noteType: noteType || undefined,
        sortBy,
        sortOrder,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const response: NotesResponse = await notesAPI.getNotes(params);

      // Check if response is valid
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format from notes API');
      }

      if (response.success === false) {
        throw new Error(response.error || 'API returned success: false');
      }

      setNotes(response.notes || []);
      setTotal(response.total || 0);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Error loading notes:', error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Authentication')) {
          toast.error('Session expired. Please log in again.');
        } else if (error.message.includes('Network')) {
          toast.error('Network error. Please check your connection.');
        } else {
          toast.error(`Failed to load notes: ${error.message}`);
        }
      } else {
        toast.error('Failed to load notes');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUsageStats = async () => {
    try {
      setStatsLoading(true);
      const response = await userAPI.getUsage();

      // Handle both direct usage object and nested response
      const usageData = response?.usage || response;

      if (usageData && typeof usageData === 'object') {
        setUsageStats(usageData);
      } else {
        console.warn('Usage stats response is empty or malformed:', response);
        setUsageStats(null);
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
      setUsageStats(null);
      // Don't show error toast for stats loading failure - it's not critical
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadNotes();
  };

  // const handleFilterChange = () => {
  //   setCurrentPage(1);
  //   loadNotes();
  // };

  const clearFilters = () => {
    setSearchTerm('');
    setNoteType('');
    setSortBy('updated_at');
    setSortOrder('desc');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await notesAPI.deleteNote(noteId);
      toast.success('Note deleted successfully');
      loadNotes();
      loadUsageStats(); // Refresh stats after deletion
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNotes.size === 0) {
      toast.error('No notes selected');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedNotes.size} selected notes?`)) {
      return;
    }

    try {
      setBulkLoading(true);
      const noteIdsArray = Array.from(selectedNotes);
      console.log('Attempting to delete notes:', noteIdsArray);

      await notesAPI.bulkDeleteNotes(noteIdsArray);
      toast.success(`Successfully deleted ${selectedNotes.size} notes`);
      setSelectedNotes(new Set());
      setBulkMode(false);
      loadNotes();
      loadUsageStats(); // Refresh stats after deletion
    } catch (error) {
      console.error('Error deleting notes:', error);

      // Provide specific error feedback
      if (error instanceof Error) {
        if (error.message.includes('validation') || error.message.includes('UUID')) {
          toast.error('Invalid note selection. Please refresh the page and try again.');
        } else if (error.message.includes('403') || error.message.includes('belong')) {
          toast.error('You do not have permission to delete some of the selected notes.');
        } else if (error.message.includes('Network')) {
          toast.error('Network error. Please check your connection and try again.');
        } else {
          toast.error(`Failed to delete notes: ${error.message}`);
        }
      } else {
        toast.error('Failed to delete selected notes');
      }
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv' | 'txt') => {
    try {
      const noteIds = selectedNotes.size > 0 ? Array.from(selectedNotes) : undefined;
      const response = await notesAPI.exportNotes({ format, noteIds });

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notes-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Notes exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting notes:', error);
      toast.error('Failed to export notes');
    }
  };

  const toggleNoteSelection = (noteId: string) => {
    const newSelected = new Set(selectedNotes);
    if (newSelected.has(noteId)) {
      newSelected.delete(noteId);
    } else {
      newSelected.add(noteId);
    }
    setSelectedNotes(newSelected);
  };

  const selectAllNotes = () => {
    if (selectedNotes.size === notes.length) {
      setSelectedNotes(new Set());
    } else {
      setSelectedNotes(new Set(notes.map(note => note.id)));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getContentPreview = (content: any, sections?: any[]) => {
    // Priority 1: Use sections array if available
    if (sections && sections.length > 0) {
      const firstSection = sections[0];
      const preview = firstSection.generated_content || firstSection.user_prompt;
      return preview.substring(0, 150) + (preview.length > 150 ? '...' : '');
    }

    // Priority 2: Handle string content
    if (typeof content === 'string') {
      return content.substring(0, 150) + (content.length > 150 ? '...' : '');
    }

    // Priority 3: Handle legacy content object
    if (content && typeof content === 'object') {
      // Check for legacy content fields
      if (content.content || content.text || content.body) {
        const legacyText = content.content || content.text || content.body;
        if (typeof legacyText === 'string') {
          return legacyText.substring(0, 150) + (legacyText.length > 150 ? '...' : '');
        }
      }

      // If it's just a section count
      if (content.sections && typeof content.sections === 'number') {
        return `Legacy note with ${content.sections} section${content.sections !== 1 ? 's' : ''} (content not migrated)`;
      }

      // Try to extract any meaningful text from object keys
      const textKeys = ['description', 'summary', 'notes', 'details'];
      for (const key of textKeys) {
        if (content[key] && typeof content[key] === 'string') {
          return content[key].substring(0, 150) + (content[key].length > 150 ? '...' : '');
        }
      }

      // Fallback for other object content
      return 'Legacy note format - click to view details';
    }

    return 'No preview available';
  };

  const exportNote = (note: Note) => {
    const exportData = {
      title: note.title,
      content: note.content,
      created_at: note.created_at,
      updated_at: note.updated_at,
      note_type: note.note_type
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Note exported successfully');
  };

  if (loading && notes.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notes History</h1>
        <p className="text-gray-600">
          View, search, and manage all your generated notes.
        </p>
      </div>

      {/* Enhanced Search and Filter Section */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Notes
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Search by title or content..."
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center gap-2"
            >
              <FunnelIcon className="h-5 w-5" />
              Filters
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Search
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Note Type Filter */}
                <div>
                  <label htmlFor="noteType" className="block text-sm font-medium text-gray-700 mb-2">
                    Note Type
                  </label>
                  <select
                    id="noteType"
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Types</option>
                    <option value="general">General</option>
                    <option value="task">Task</option>
                    <option value="comment">Comment</option>
                    <option value="progress">Progress</option>
                    <option value="assessment">Assessment</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    id="sortBy"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="updated_at">Last Updated</option>
                    <option value="created_at">Date Created</option>
                    <option value="title">Title</option>
                    <option value="note_type">Type</option>
                    <option value="tokens_used">Tokens Used</option>
                    <option value="cost">Cost</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-2">
                    Order
                  </label>
                  <select
                    id="sortOrder"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    View Mode
                  </label>
                  <div className="flex rounded-md shadow-sm">
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                        viewMode === 'list'
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <ListBulletIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                        viewMode === 'grid'
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Squares2X2Icon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Date Range Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear All Filters
                </button>

                <div className="flex gap-2">
                  {/* Bulk Actions */}
                  <button
                    type="button"
                    onClick={() => setBulkMode(!bulkMode)}
                    className={`px-4 py-2 text-sm rounded-md border ${
                      bulkMode
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {bulkMode ? 'Exit Bulk Mode' : 'Bulk Actions'}
                  </button>

                  {/* Export Dropdown */}
                  <div className="relative inline-block text-left">
                    <button
                      type="button"
                      onClick={() => handleExport('json')}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      Export JSON
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Enhanced Statistics Section */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">

        {statsLoading ? (
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        ) : usageStats ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {typeof usageStats.totalNotes === 'number' ? usageStats.totalNotes.toLocaleString() : '0'}
              </div>
              <div className="text-sm text-gray-600">Total Notes</div>
              <div className="text-xs text-gray-500 mt-1">
                {usageStats.todayNotes || 0} today, {usageStats.weeklyNotes || 0} this week
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {typeof usageStats.totalTokens === 'number' ? usageStats.totalTokens.toLocaleString() : '0'}
              </div>
              <div className="text-sm text-gray-600">Total Tokens</div>
              <div className="text-xs text-gray-500 mt-1">
                Avg: {typeof usageStats.averageTokensPerNote === 'number' ? usageStats.averageTokensPerNote.toLocaleString() : '0'} per note
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                ${typeof usageStats.totalCost === 'number' ? usageStats.totalCost.toFixed(4) : '0.0000'}
              </div>
              <div className="text-sm text-gray-600">Total Cost</div>
              <div className="text-xs text-gray-500 mt-1">
                Avg: ${typeof usageStats.averageCostPerNote === 'number' ? usageStats.averageCostPerNote.toFixed(4) : '0.0000'} per note
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {typeof usageStats.totalTimeSavedHours === 'number' ? usageStats.totalTimeSavedHours : 0}h
              </div>
              <div className="text-sm text-gray-600">Time Saved</div>
              <div className="text-xs text-gray-500 mt-1">
                {usageStats.recentNotes || 0} notes last 30 days
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{total}</div>
              <div className="text-sm text-gray-600">Total Notes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {notes.reduce((sum, note) => sum + (note.tokens_used || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Tokens Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                ${notes.reduce((sum, note) => sum + (note.cost || 0), 0).toFixed(4)}
              </div>
              <div className="text-sm text-gray-600">Total Cost</div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {bulkMode && notes.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={selectAllNotes}
                className="flex items-center space-x-2 text-sm text-blue-700 hover:text-blue-900"
              >
                <CheckIcon className="h-4 w-4" />
                <span>
                  {selectedNotes.size === notes.length ? 'Deselect All' : 'Select All'}
                </span>
              </button>
              <span className="text-sm text-blue-700">
                {selectedNotes.size} of {notes.length} notes selected
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExport('csv')}
                disabled={selectedNotes.size === 0}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export CSV
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={selectedNotes.size === 0 || bulkLoading}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkLoading ? 'Deleting...' : 'Delete Selected'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg">
        {notes.length === 0 ? (
          <div className="p-12 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notes found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms.' : 'Start by generating your first note.'}
            </p>
            {!searchTerm && (
              <a
                href="/generate"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              >
                Generate Your First Note
              </a>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notes.map((note) => (
              <div key={note.id} className={`p-6 hover:bg-gray-50 ${selectedNotes.has(note.id) ? 'bg-blue-50' : ''}`}>
                <div className="flex items-start justify-between">
                  {/* Bulk Selection Checkbox */}
                  {bulkMode && (
                    <div className="mr-4 pt-1">
                      <input
                        type="checkbox"
                        checked={selectedNotes.has(note.id)}
                        onChange={() => toggleNoteSelection(note.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {note.title}
                    </h3>

                    <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {formatDate(note.created_at)}
                      </div>

                      {note.updated_at !== note.created_at && (
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Updated {formatDate(note.updated_at)}
                        </div>
                      )}

                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {note.note_type}
                        </span>
                      </div>

                      {note.tokens_used && (
                        <div className="text-xs">
                          {note.tokens_used.toLocaleString()} tokens
                        </div>
                      )}

                      {note.cost && (
                        <div className="text-xs">
                          ${note.cost.toFixed(4)}
                        </div>
                      )}

                      {note.sections && note.sections.length > 0 && (
                        <div className="text-xs">
                          {note.sections.length} sections
                        </div>
                      )}
                    </div>

                    <p className="mt-3 text-gray-600 line-clamp-2">
                      {getContentPreview(note.content, note.sections)}
                    </p>
                  </div>

                  <div className="ml-4 flex items-center space-x-2">
                    <button
                      onClick={async () => {
                        try {
                          setLoadingNoteDetails(true);

                          // If the note already has sections, use it directly
                          if (note.sections && note.sections.length > 0) {
                            setSelectedNote(note);
                            setShowNoteModal(true);
                            setLoadingNoteDetails(false);
                            return;
                          }

                          // Otherwise, fetch the complete note data with sections
                          const completeNote = await notesAPI.getNote(note.id);
                          if (completeNote && completeNote.note) {
                            setSelectedNote(completeNote.note);
                          } else {
                            setSelectedNote(note);
                          }
                          setShowNoteModal(true);
                        } catch (error) {
                          console.error('Error fetching complete note:', error);
                          toast.error('Failed to load note details');
                          // Fallback to the note we have
                          setSelectedNote(note);
                          setShowNoteModal(true);
                        } finally {
                          setLoadingNoteDetails(false);
                        }
                      }}
                      disabled={loadingNoteDetails}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                      title="View Note"
                    >
                      {loadingNoteDetails ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>

                    <button
                      onClick={() => exportNote(note)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                      title="Export Note"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                      title="Delete Note"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} results
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex items-center space-x-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && selectedNote && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedNote.title}
              </h3>
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setSelectedNote(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 text-sm text-gray-500 space-y-1">
              <div>Created: {formatDate(selectedNote.created_at)}</div>
              {selectedNote.updated_at !== selectedNote.created_at && (
                <div>Updated: {formatDate(selectedNote.updated_at)}</div>
              )}
              <div>Type: {selectedNote.note_type}</div>
              {selectedNote.tokens_used && (
                <div>Tokens Used: {selectedNote.tokens_used.toLocaleString()}</div>
              )}
              {selectedNote.cost && (
                <div>Cost: ${selectedNote.cost.toFixed(4)}</div>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">Content</h4>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                {loadingNoteDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <span className="ml-3 text-gray-600">Loading note content...</span>
                  </div>
                ) : (
                  <NoteContentDisplay selectedNote={selectedNote} />
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => exportNote(selectedNote)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Export
              </button>
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setSelectedNote(null);
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesHistoryPage;
