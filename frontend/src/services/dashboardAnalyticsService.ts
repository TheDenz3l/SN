/**
 * Dashboard Analytics Service
 * Handles fetching real analytics data for the dashboard
 */

export interface DashboardSummary {
  totalNotes: number;
  notesGenerated: number;
  creditsUsed: number;
  timeSavedHours: number;
  aiGenerations: number;
  templatesUsed: number;
}

export interface DashboardTrends {
  notesChange: number;
  creditsChange: number;
  timeSavedChange: number;
}

export interface RecentActivity {
  id: string;
  title: string;
  type: string;
  createdAt: string;
}

export interface DashboardAnalytics {
  summary: DashboardSummary;
  trends: DashboardTrends;
  recentActivity: RecentActivity[];
}

class DashboardAnalyticsService {
  private baseUrl = '/api/analytics';

  async getDashboardAnalytics(period: string = 'month'): Promise<{
    success: boolean;
    analytics?: DashboardAnalytics;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboard?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to fetch dashboard analytics' };
      }

      return { success: true, analytics: result.analytics };
    } catch (error) {
      console.error('Dashboard analytics error:', error);
      return { success: false, error: 'Network error while fetching dashboard analytics' };
    }
  }

  async getProductivityInsights(period: string = 'month'): Promise<{
    success: boolean;
    productivity?: any;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/productivity?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to fetch productivity insights' };
      }

      return { success: true, productivity: result.productivity };
    } catch (error) {
      console.error('Productivity insights error:', error);
      return { success: false, error: 'Network error while fetching productivity insights' };
    }
  }

  // Helper method to format change values for display
  formatChange(change: number): { text: string; type: 'increase' | 'decrease' | 'neutral' } {
    if (change > 0) {
      return { text: `+${change}%`, type: 'increase' };
    } else if (change < 0) {
      return { text: `${change}%`, type: 'decrease' };
    } else {
      return { text: '0%', type: 'neutral' };
    }
  }

  // Helper method to format time saved
  formatTimeSaved(hours: number): string {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    } else if (hours < 10) {
      return `${hours.toFixed(1)} hrs`;
    } else {
      return `${Math.round(hours)} hrs`;
    }
  }

  // Helper method to format dates for recent activity
  formatActivityDate(dateString: string): { date: string; time: string } {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateText: string;
    if (date.toDateString() === today.toDateString()) {
      dateText = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateText = 'Yesterday';
    } else {
      dateText = date.toLocaleDateString();
    }

    const timeText = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return { date: dateText, time: timeText };
  }
}

export const dashboardAnalyticsService = new DashboardAnalyticsService();
export default dashboardAnalyticsService;
