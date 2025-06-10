import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { notesAPI, userAPI } from '../services/apiService';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  ArchiveBoxIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Import our intuitive components
import IntuitiveCard, { StatsCard, ActionCard } from '../components/intuitive/IntuitiveCard';
import IntuitiveButton from '../components/intuitive/IntuitiveButton';

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
}

const IntuitiveNotesHistoryPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  // Filter and sorting states
  const [noteType, setNoteType] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const itemsPerPage = 10;

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);

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
      };

      const response = await notesAPI.getNotes(params);

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
  }, [currentPage, searchTerm, noteType, sortBy, sortOrder]);

  const loadUsageStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await userAPI.getUsage();
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
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadNotes();
      loadUsageStats();
    }
  }, [isAuthenticated, user?.id, loadNotes, loadUsageStats]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadNotes();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setNoteType('');
    setSortBy('updated_at');
    setSortOrder('desc');
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
      loadUsageStats();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
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

  const getContentPreview = (content: any, sections?: any[]): string => {
    if (sections && sections.length > 0) {
      const firstSection = sections[0];
      return firstSection.generated_content?.substring(0, 150) + '...' || 'No content';
    }

    if (typeof content === 'string') {
      return content.substring(0, 150) + '...';
    }

    if (content && typeof content === 'object') {
      const textContent = JSON.stringify(content).substring(0, 150);
      return textContent + '...';
    }

    return 'No content available';
  };

  const formatTimeSaved = (hours: number): string => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    return `${hours.toFixed(1)} hrs`;
  };

  // Loading state
  if (loading && notes.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <IntuitiveCard variant="subtle" padding="lg" loading>
          <div className="h-8 w-1/3 mb-4"></div>
          <div className="h-4 w-2/3"></div>
        </IntuitiveCard>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <IntuitiveCard key={i} padding="md" loading>
              <div className="h-20"></div>
            </IntuitiveCard>
          ))}
        </div>
        
        <IntuitiveCard padding="lg" loading>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24"></div>
            ))}
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
            <DocumentTextIcon className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notes History</h1>
            <p className="text-gray-600 text-lg">
              View, search, and manage all your generated notes.
            </p>
          </div>
        </div>
      </IntuitiveCard>

      {/* Usage Statistics */}
      {!statsLoading && usageStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Notes"
            value={usageStats.totalNotes?.toString() || '0'}
            icon={<DocumentTextIcon className="w-6 h-6" />}
            loading={statsLoading}
          />
          <StatsCard
            title="This Week"
            value={usageStats.weeklyNotes?.toString() || '0'}
            icon={<CalendarIcon className="w-6 h-6" />}
            loading={statsLoading}
          />
          <StatsCard
            title="Time Saved"
            value={usageStats.totalTimeSavedHours ? formatTimeSaved(usageStats.totalTimeSavedHours) : '0 hrs'}
            icon={<ClockIcon className="w-6 h-6" />}
            loading={statsLoading}
          />
          <StatsCard
            title="Total Tokens"
            value={usageStats.totalTokens?.toLocaleString() || '0'}
            icon={<ChartBarIcon className="w-6 h-6" />}
            loading={statsLoading}
          />
        </div>
      )}

      {/* Search and Filters */}
      <IntuitiveCard variant="default" padding="lg">
        <div className="space-y-6">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notes by title or content..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-card focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200"
              />
            </div>
            <IntuitiveButton
              type="submit"
              variant="primary"
              size="md"
              icon={<MagnifyingGlassIcon />}
            >
              Search
            </IntuitiveButton>
          </form>

          {/* Quick Filters and View Options */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <IntuitiveButton
                variant={showFilters ? "primary" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                icon={<FunnelIcon />}
              >
                Filters
              </IntuitiveButton>

              {(searchTerm || noteType || sortBy !== 'updated_at' || sortOrder !== 'desc') && (
                <IntuitiveButton
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear All
                </IntuitiveButton>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">View:</span>
              <IntuitiveButton
                variant={viewMode === 'list' ? "primary" : "ghost"}
                size="sm"
                onClick={() => setViewMode('list')}
                icon={<ListBulletIcon />}
              />
              <IntuitiveButton
                variant={viewMode === 'grid' ? "primary" : "ghost"}
                size="sm"
                onClick={() => setViewMode('grid')}
                icon={<Squares2X2Icon />}
              />
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="noteType" className="block text-sm font-medium text-gray-700 mb-2">
                    Note Type
                  </label>
                  <select
                    id="noteType"
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-card focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  >
                    <option value="">All Types</option>
                    <option value="general">General</option>
                    <option value="task">Task</option>
                    <option value="comment">Comment</option>
                    <option value="progress">Progress</option>
                    <option value="assessment">Assessment</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    id="sortBy"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-card focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  >
                    <option value="updated_at">Last Updated</option>
                    <option value="created_at">Date Created</option>
                    <option value="title">Title</option>
                    <option value="tokens_used">Tokens Used</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-2">
                    Order
                  </label>
                  <select
                    id="sortOrder"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-card focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </IntuitiveCard>

      {/* Notes List */}
      {notes.length === 0 ? (
        <IntuitiveCard variant="default" padding="xl">
          <div className="text-center py-12">
            <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notes found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || noteType
                ? "Try adjusting your search criteria or filters."
                : "You haven't generated any notes yet. Create your first note to get started."
              }
            </p>
            {!searchTerm && !noteType && (
              <IntuitiveButton
                variant="primary"
                size="lg"
                onClick={() => navigate('/generate')}
                icon={<PlusIcon />}
              >
                Generate Your First Note
              </IntuitiveButton>
            )}
          </div>
        </IntuitiveCard>
      ) : (
        <div className="space-y-6">
          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} notes
            </p>

            {total > itemsPerPage && (
              <div className="flex items-center space-x-2">
                <IntuitiveButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  icon={<ChevronLeftIcon />}
                >
                  Previous
                </IntuitiveButton>

                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>

                <IntuitiveButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  icon={<ChevronRightIcon />}
                >
                  Next
                </IntuitiveButton>
              </div>
            )}
          </div>

          {/* Notes Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.map((note, index) => (
                <div key={note.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <IntuitiveCard variant="default" hover className="h-full">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {note.title}
                        </h3>
                        <div className="flex items-center space-x-1 ml-2">
                          <IntuitiveButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // TODO: Implement note viewing modal
                              toast('Note viewing feature coming soon!');
                            }}
                            icon={<EyeIcon />}
                            tooltip="View note"
                          />
                          <IntuitiveButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(note.id)}
                            icon={<TrashIcon />}
                            tooltip="Delete note"
                          />
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                        {getContentPreview(note.content, note.sections)}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatDate(note.updated_at)}</span>
                        {note.sections && (
                          <span>{note.sections.length} sections</span>
                        )}
                      </div>
                    </div>
                  </IntuitiveCard>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note, index) => (
                <div key={note.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <IntuitiveCard variant="default" hover>
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {note.title}
                          </h3>

                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <span className="flex items-center">
                              <CalendarIcon className="w-4 h-4 mr-1" />
                              {formatDate(note.updated_at)}
                            </span>
                            {note.tokens_used && (
                              <span>{note.tokens_used} tokens</span>
                            )}
                            {note.sections && note.sections.length > 0 && (
                              <span>{note.sections.length} sections</span>
                            )}
                          </div>

                          <p className="text-gray-600 line-clamp-2">
                            {getContentPreview(note.content, note.sections)}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <IntuitiveButton
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // TODO: Implement note viewing modal
                              toast('Note viewing feature coming soon!');
                            }}
                            icon={<EyeIcon />}
                          >
                            View
                          </IntuitiveButton>
                          <IntuitiveButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteNote(note.id)}
                            icon={<TrashIcon />}
                          >
                            Delete
                          </IntuitiveButton>
                        </div>
                      </div>
                    </div>
                  </IntuitiveCard>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ActionCard
          title="Generate New Note"
          description="Create a new AI-powered note with your ISP tasks"
          action="Start generating"
          icon={<PlusIcon className="w-6 h-6" />}
          onClick={() => navigate('/generate')}
        />

        <ActionCard
          title="Export Notes"
          description="Download your notes in various formats"
          action="Export data"
          icon={<ArrowDownTrayIcon className="w-6 h-6" />}
          onClick={() => toast('Export feature coming soon!')}
        />

        <ActionCard
          title="View Analytics"
          description="See detailed insights about your note generation"
          action="View analytics"
          icon={<ChartBarIcon className="w-6 h-6" />}
          onClick={() => navigate('/dashboard')}
        />
      </div>
    </div>
  );
};

export default IntuitiveNotesHistoryPage;
