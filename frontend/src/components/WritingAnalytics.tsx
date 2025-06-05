/**
 * Writing Analytics Component
 * Displays user's writing style learning progress and analytics
 */

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  StarIcon,
  ClockIcon,
  DocumentTextIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import writingAnalyticsService, { AnalyticsSummary, AnalyticsRecord, StyleEvolution } from '../services/writingAnalyticsService';
import toast from 'react-hot-toast';

interface WritingAnalyticsProps {
  className?: string;
}

const WritingAnalytics: React.FC<WritingAnalyticsProps> = ({ className = '' }) => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recentAnalytics, setRecentAnalytics] = useState<AnalyticsRecord[]>([]);
  const [styleEvolution, setStyleEvolution] = useState<StyleEvolution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'evolution'>('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const [summaryResult, historyResult, evolutionResult] = await Promise.all([
        writingAnalyticsService.getAnalyticsSummary(),
        writingAnalyticsService.getAnalyticsHistory(10, 0),
        writingAnalyticsService.getStyleEvolutionHistory(5)
      ]);

      if (summaryResult.success && summaryResult.summary) {
        setSummary(summaryResult.summary);
      }

      if (historyResult.success && historyResult.analytics) {
        setRecentAnalytics(historyResult.analytics);
      }

      if (evolutionResult.success && evolutionResult.evolution) {
        setStyleEvolution(evolutionResult.evolution);
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUpIcon className="h-5 w-5 text-green-500" />;
      case 'declining':
        return <TrendingDownIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ChartBarIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-blue-600 bg-blue-100';
    if (confidence >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i}>
        {i < rating ? (
          <StarIconSolid className="h-4 w-4 text-yellow-400" />
        ) : (
          <StarIcon className="h-4 w-4 text-gray-300" />
        )}
      </span>
    ));
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2" />
          Writing Analytics
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Track your writing style learning progress and AI performance
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', name: 'Overview', icon: ChartBarIcon },
            { id: 'history', name: 'History', icon: ClockIcon },
            { id: 'evolution', name: 'Evolution', icon: TrendingUpIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Stats */}
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Notes</p>
                      <p className="text-2xl font-bold text-gray-900">{summary.total_notes}</p>
                    </div>
                    <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(summary.avg_confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className={`p-2 rounded-full ${getConfidenceColor(summary.avg_confidence)}`}>
                      <CheckCircleIcon className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                      <div className="flex items-center">
                        <span className="text-2xl font-bold text-gray-900 mr-2">
                          {summary.avg_satisfaction.toFixed(1)}
                        </span>
                        <div className="flex">
                          {renderStars(Math.round(summary.avg_satisfaction))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Trend</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {summary.improvement_trend}
                      </p>
                    </div>
                    {getTrendIcon(summary.improvement_trend)}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              {recentAnalytics.length > 0 ? (
                <div className="space-y-3">
                  {recentAnalytics.slice(0, 5).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {record.notes?.title || 'Untitled Note'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(record.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(record.confidence_score)}`}>
                          {(record.confidence_score * 100).toFixed(0)}%
                        </div>
                        {record.user_satisfaction_score && (
                          <div className="flex">
                            {renderStars(record.user_satisfaction_score)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Generate some notes to see your writing analytics here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Analytics History</h3>
            {recentAnalytics.length > 0 ? (
              <div className="space-y-4">
                {recentAnalytics.map((record) => (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {record.notes?.title || 'Untitled Note'}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(record.created_at).toLocaleString()}
                        </p>
                        {record.note_sections?.user_prompt && (
                          <p className="text-sm text-gray-600 mt-2">
                            "{record.note_sections.user_prompt}"
                          </p>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(record.confidence_score)}`}>
                          Confidence: {(record.confidence_score * 100).toFixed(0)}%
                        </div>
                        {record.style_match_score && (
                          <div className="text-xs text-gray-500 mt-1">
                            Style Match: {(record.style_match_score * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                    </div>
                    {record.feedback_notes && (
                      <div className="mt-3 p-2 bg-blue-50 rounded">
                        <p className="text-sm text-blue-800">{record.feedback_notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No history available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your analytics history will appear here as you use the system.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'evolution' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Style Evolution</h3>
            {styleEvolution.length > 0 ? (
              <div className="space-y-4">
                {styleEvolution.map((evolution) => (
                  <div key={evolution.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {evolution.trigger_reason}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(evolution.created_at).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          Analyzed {evolution.notes_analyzed} notes
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-xs text-gray-500">
                          Confidence: {evolution.confidence_before?.toFixed(2) || 'N/A'} → {evolution.confidence_after.toFixed(2)}
                        </div>
                        {evolution.confidence_after > (evolution.confidence_before || 0) ? (
                          <TrendingUpIcon className="h-4 w-4 text-green-500 mt-1" />
                        ) : (
                          <TrendingDownIcon className="h-4 w-4 text-red-500 mt-1" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No evolution history</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your writing style evolution will be tracked here as the system learns.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WritingAnalytics;
