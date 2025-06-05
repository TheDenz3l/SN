/**
 * Analytics Dashboard Page
 * Comprehensive view of writing analytics and style learning progress
 */

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  TrendingUpIcon,
  StarIcon,
  ClockIcon,
  LightBulbIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import WritingAnalytics from '../components/WritingAnalytics';
import WritingStyleConfidence from '../components/WritingStyleConfidence';
import writingAnalyticsService from '../services/writingAnalyticsService';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

interface QuickStats {
  totalNotes: number;
  avgConfidence: number;
  avgSatisfaction: number;
  recentActivity: number;
  improvementTrend: 'improving' | 'declining' | 'stable';
}

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const result = await writingAnalyticsService.getAnalyticsSummary();
      if (result.success && result.summary) {
        setQuickStats({
          totalNotes: result.summary.total_notes,
          avgConfidence: result.summary.avg_confidence,
          avgSatisfaction: result.summary.avg_satisfaction,
          recentActivity: result.summary.recent_notes,
          improvementTrend: result.summary.improvement_trend
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await writingAnalyticsService.updateStyleConfidence();
      await loadDashboardData();
      toast.success('Analytics data refreshed');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatColor = (type: string, value: number) => {
    switch (type) {
      case 'confidence':
        if (value >= 0.8) return 'text-green-600 bg-green-100';
        if (value >= 0.6) return 'text-blue-600 bg-blue-100';
        if (value >= 0.4) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
      case 'satisfaction':
        if (value >= 4) return 'text-green-600 bg-green-100';
        if (value >= 3) return 'text-blue-600 bg-blue-100';
        if (value >= 2) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded-lg"></div>
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
              <p className="text-gray-600">
                Track your writing style learning progress and AI performance insights.
              </p>
            </div>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {quickStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Notes</p>
                  <p className="text-2xl font-bold text-gray-900">{quickStats.totalNotes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {(quickStats.avgConfidence * 100).toFixed(0)}%
                    </p>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatColor('confidence', quickStats.avgConfidence)}`}>
                      {quickStats.avgConfidence >= 0.6 ? 'Good' : 'Learning'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <StarIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Satisfaction</p>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {quickStats.avgSatisfaction.toFixed(1)}
                    </p>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatColor('satisfaction', quickStats.avgSatisfaction)}`}>
                      /5.0
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUpIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Trend</p>
                  <div className="flex items-center">
                    <p className={`text-lg font-bold capitalize ${getTrendColor(quickStats.improvementTrend)}`}>
                      {quickStats.improvementTrend}
                    </p>
                    <span className="ml-2 text-sm text-gray-500">
                      ({quickStats.recentActivity} recent)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Writing Style Confidence - Full Height */}
          <div className="lg:col-span-1">
            <WritingStyleConfidence className="h-full" showDetails={true} />
          </div>

          {/* Writing Analytics - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <WritingAnalytics className="h-full" />
          </div>
        </div>

        {/* Insights and Recommendations */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <LightBulbIcon className="h-5 w-5 mr-2" />
              Insights & Recommendations
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickStats && (
                <>
                  {quickStats.avgConfidence < 0.5 && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="text-sm font-medium text-blue-800 mb-2">🚀 Boost Your Confidence</h3>
                      <p className="text-sm text-blue-700">
                        Your writing style confidence is still building. Generate more notes and provide feedback 
                        to help the AI learn your preferences better.
                      </p>
                    </div>
                  )}

                  {quickStats.avgSatisfaction < 3 && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h3 className="text-sm font-medium text-yellow-800 mb-2">⭐ Improve Satisfaction</h3>
                      <p className="text-sm text-yellow-700">
                        Consider updating your writing style sample or providing more detailed prompts 
                        to get better results that match your expectations.
                      </p>
                    </div>
                  )}

                  {quickStats.improvementTrend === 'declining' && (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <h3 className="text-sm font-medium text-red-800 mb-2">📉 Declining Trend</h3>
                      <p className="text-sm text-red-700">
                        Recent performance has been declining. This might indicate that your writing style 
                        has evolved. Consider updating your style sample.
                      </p>
                    </div>
                  )}

                  {quickStats.avgConfidence >= 0.8 && quickStats.avgSatisfaction >= 4 && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h3 className="text-sm font-medium text-green-800 mb-2">🎉 Excellent Performance!</h3>
                      <p className="text-sm text-green-700">
                        Your AI is performing excellently! High confidence and satisfaction scores indicate 
                        that the system has learned your writing style very well.
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-800 mb-2">💡 Pro Tips</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Edit generated content to show your preferences</li>
                  <li>• Rate content quality to improve future generations</li>
                  <li>• Provide specific feedback in your ratings</li>
                  <li>• Update your writing style as it evolves</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
