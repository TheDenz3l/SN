import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { analyticsAPI } from '../services/apiService';
import toast from 'react-hot-toast';
import {
  DocumentTextIcon,
  CreditCardIcon,
  ClockIcon,
  ChartBarIcon,
  PlusIcon,
  CogIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

// Import our new intuitive components
import IntuitiveCard, { StatsCard, ActionCard } from '../components/intuitive/IntuitiveCard';
import IntuitiveButton from '../components/intuitive/IntuitiveButton';

interface AnalyticsData {
  summary: {
    totalNotes: number;
    creditsUsed: number;
    timeSavedHours: number;
    notesGenerated: number;
  };
  trends: {
    notesChange: number;
    timeSavedChange: number;
  };
}

const IntuitiveDashboardPage: React.FC = () => {
  const { user, getUserDisplayName } = useAuthStore();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load dashboard analytics
  const loadAnalytics = async (showRefreshToast = false) => {
    if (showRefreshToast) setIsRefreshing(true);

    try {
      const result = await analyticsAPI.getDashboard('month');
      if (result.analytics) {
        setAnalytics(result.analytics);
        if (showRefreshToast) {
          toast.success('Dashboard data refreshed');
        }
      } else {
        console.error('Failed to load analytics: No analytics data returned');
        if (showRefreshToast) {
          toast.error('Failed to refresh dashboard data');
        }
      }
    } catch (error) {
      console.error('Analytics loading error:', error);
      if (showRefreshToast) {
        toast.error('Failed to refresh dashboard data');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  // Helper functions for data formatting
  const formatTimeSaved = (hours: number): string => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    return `${hours.toFixed(1)} hrs`;
  };

  const formatChange = (change: number) => {
    const absChange = Math.abs(change);
    const text = `${change > 0 ? '+' : change < 0 ? '-' : ''}${absChange.toFixed(1)}%`;
    const type = change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral';
    return { text, type };
  };

  // Generate stats from analytics data
  const getStats = () => {
    if (!analytics) {
      return [
        { title: 'Total Notes', value: '0', icon: DocumentTextIcon },
        { title: 'Credits Remaining', value: user?.credits?.toString() || '0', icon: CreditCardIcon },
        { title: 'Time Saved', value: '0 hrs', icon: ClockIcon },
        { title: 'This Month', value: '0', icon: ChartBarIcon },
      ];
    }

    const timeSavedFormatted = formatTimeSaved(analytics.summary.timeSavedHours);
    const notesChange = formatChange(analytics.trends.notesChange);
    const timeSavedChange = formatChange(analytics.trends.timeSavedChange);

    return [
      {
        title: 'Total Notes',
        value: analytics.summary.totalNotes.toString(),
        change: notesChange.text,
        changeType: notesChange.type,
        icon: DocumentTextIcon,
      },
      {
        title: 'Credits Remaining',
        value: user?.credits?.toString() || '0',
        change: analytics.summary.creditsUsed.toString(),
        changeType: 'decrease' as const,
        icon: CreditCardIcon,
      },
      {
        title: 'Time Saved',
        value: timeSavedFormatted,
        change: timeSavedChange.text,
        changeType: timeSavedChange.type,
        icon: ClockIcon,
      },
      {
        title: 'This Month',
        value: analytics.summary.notesGenerated.toString(),
        change: notesChange.text,
        changeType: notesChange.type,
        icon: ChartBarIcon,
      },
    ];
  };

  const stats = getStats();

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Welcome Header */}
      <IntuitiveCard variant="subtle" padding="lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {getUserDisplayName()}! 👋
            </h1>
            <p className="text-gray-600 text-lg">
              Here's what's happening with your notes today.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <IntuitiveButton
              variant="primary"
              size="md"
              onClick={() => navigate('/notes')}
              icon={<DocumentTextIcon />}
              tooltip="View all your notes"
            >
              My Notes
            </IntuitiveButton>
            <IntuitiveButton
              variant="outline"
              size="md"
              onClick={() => loadAnalytics(true)}
              isLoading={isRefreshing}
              tooltip="Refresh dashboard data"
              icon={<ArrowTrendingUpIcon />}
            >
              Refresh
            </IntuitiveButton>
          </div>
        </div>
      </IntuitiveCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={stat.title} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
            <StatsCard
              title={stat.title}
              value={stat.value}
              change={'change' in stat ? stat.change : undefined}
              changeType={'changeType' in stat ? stat.changeType as 'increase' | 'decrease' | 'neutral' : undefined}
              icon={<stat.icon className="w-6 h-6" />}
              loading={isLoading}
            />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          <p className="text-sm text-gray-600">Get started with these common tasks</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActionCard
            title="📝 View All Notes"
            description="Browse, search, and manage your complete notes library"
            action="Open Notes"
            icon={<DocumentTextIcon className="w-6 h-6" />}
            onClick={() => navigate('/notes')}
            variant="featured"
          />

          <ActionCard
            title="Generate New Note"
            description="Create AI-powered notes based on your ISP tasks and writing style"
            action="Start generating"
            icon={<PlusIcon className="w-6 h-6" />}
            onClick={() => navigate('/generate')}
          />

          <ActionCard
            title="Complete Setup"
            description="Configure your writing style and ISP tasks for better results"
            action="Go to setup"
            icon={<CogIcon className="w-6 h-6" />}
            onClick={() => navigate('/setup')}
            disabled={user?.hasCompletedSetup}
          />
        </div>
      </div>

      {/* Setup Reminder */}
      {!user?.hasCompletedSetup && (
        <IntuitiveCard variant="interactive" padding="lg">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <CogIcon className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Complete your setup to get started
              </h3>
              <p className="text-gray-600 mb-4">
                To get the most out of SwiftNotes, please complete your account setup 
                by adding your writing style and ISP tasks. This will help our AI generate 
                more personalized and accurate notes.
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

      {/* Notes Access Guide */}
      {analytics?.summary?.totalNotes && analytics.summary.totalNotes > 0 && (
        <IntuitiveCard variant="interactive" padding="lg">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                📚 You have {analytics?.summary?.totalNotes || 0} notes in your library
              </h3>
              <p className="text-gray-600 mb-4">
                Access all your notes anytime by clicking "My Notes" in the sidebar or using the button above.
                You can search, filter, and manage your entire notes collection there.
              </p>
              <div className="flex items-center space-x-3">
                <IntuitiveButton
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/notes')}
                  icon={<DocumentTextIcon />}
                >
                  View All Notes
                </IntuitiveButton>
                <IntuitiveButton
                  variant="outline"
                  size="md"
                  onClick={() => navigate('/generate')}
                  icon={<PlusIcon />}
                >
                  Create New Note
                </IntuitiveButton>
              </div>
            </div>
          </div>
        </IntuitiveCard>
      )}

      {/* Recent Activity Placeholder */}
      {(!analytics || analytics.summary.totalNotes === 0) && (
        <IntuitiveCard variant="default" padding="lg">
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to get started?</h3>
            <p className="text-gray-600 mb-6">
              Create your first AI-powered note and it will appear in your Notes History.
              You can access all your notes anytime from the sidebar navigation.
            </p>
            <div className="flex items-center justify-center space-x-3">
              <IntuitiveButton
                variant="primary"
                size="lg"
                onClick={() => navigate('/generate')}
                icon={<PlusIcon />}
              >
                Generate Your First Note
              </IntuitiveButton>
              <IntuitiveButton
                variant="outline"
                size="lg"
                onClick={() => navigate('/notes')}
                icon={<DocumentTextIcon />}
              >
                View Notes Page
              </IntuitiveButton>
            </div>
          </div>
        </IntuitiveCard>
      )}
    </div>
  );
};

export default IntuitiveDashboardPage;
