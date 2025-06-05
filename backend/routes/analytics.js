/**
 * Advanced Analytics Routes
 * Provides comprehensive analytics and insights for users and organizations
 */

const express = require('express');
const { query, validationResult } = require('express-validator');
const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Validation rules
const validateDateRange = [
  query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid ISO date'),
  query('period').optional().isIn(['day', 'week', 'month', 'quarter', 'year']).withMessage('Invalid period'),
];

/**
 * GET /api/analytics/dashboard
 * Get user dashboard analytics
 */
router.get('/dashboard', validateDateRange, handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const { startDate, endDate, period = 'month' } = req.query;

    // Calculate date range
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : (() => {
      const date = new Date();
      switch (period) {
        case 'day': date.setDate(date.getDate() - 1); break;
        case 'week': date.setDate(date.getDate() - 7); break;
        case 'month': date.setMonth(date.getMonth() - 1); break;
        case 'quarter': date.setMonth(date.getMonth() - 3); break;
        case 'year': date.setFullYear(date.getFullYear() - 1); break;
        default: date.setMonth(date.getMonth() - 1);
      }
      return date;
    })();

    // Get user analytics for the period
    const { data: analytics, error: analyticsError } = await supabase
      .from('user_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', end.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (analyticsError) {
      console.error('Analytics fetch error:', analyticsError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics'
      });
    }

    // Get total notes count
    const { count: totalNotes, error: notesError } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get recent notes for activity
    const { data: recentNotes, error: recentError } = await supabase
      .from('notes')
      .select('id, title, created_at, note_type')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get template usage
    const { data: templateUsage, error: templateError } = await supabase
      .from('template_usage')
      .select(`
        used_at,
        templates (
          id,
          name,
          category
        )
      `)
      .eq('user_id', userId)
      .gte('used_at', start.toISOString())
      .lte('used_at', end.toISOString())
      .order('used_at', { ascending: false })
      .limit(20);

    // Calculate summary statistics
    const totalNotesGenerated = analytics.reduce((sum, day) => sum + day.notes_generated, 0);
    const totalCreditsUsed = analytics.reduce((sum, day) => sum + day.credits_used, 0);
    const totalTimeSaved = analytics.reduce((sum, day) => sum + day.time_saved_minutes, 0);
    const totalAIGenerations = analytics.reduce((sum, day) => sum + day.ai_generations, 0);

    // Calculate trends (compare with previous period)
    const periodLength = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const previousStart = new Date(start);
    previousStart.setDate(previousStart.getDate() - periodLength);
    const previousEnd = new Date(start);

    const { data: previousAnalytics } = await supabase
      .from('user_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('date', previousStart.toISOString().split('T')[0])
      .lt('date', previousEnd.toISOString().split('T')[0]);

    const previousNotesGenerated = previousAnalytics?.reduce((sum, day) => sum + day.notes_generated, 0) || 0;
    const previousCreditsUsed = previousAnalytics?.reduce((sum, day) => sum + day.credits_used, 0) || 0;
    const previousTimeSaved = previousAnalytics?.reduce((sum, day) => sum + day.time_saved_minutes, 0) || 0;

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    res.json({
      success: true,
      analytics: {
        summary: {
          totalNotes: totalNotes || 0,
          notesGenerated: totalNotesGenerated,
          creditsUsed: totalCreditsUsed,
          timeSavedHours: Math.round(totalTimeSaved / 60 * 10) / 10,
          aiGenerations: totalAIGenerations,
          templatesUsed: templateUsage?.length || 0
        },
        trends: {
          notesChange: calculateChange(totalNotesGenerated, previousNotesGenerated),
          creditsChange: calculateChange(totalCreditsUsed, previousCreditsUsed),
          timeSavedChange: calculateChange(totalTimeSaved, previousTimeSaved)
        },
        dailyData: analytics.map(day => ({
          date: day.date,
          notesGenerated: day.notes_generated,
          creditsUsed: day.credits_used,
          timeSavedMinutes: day.time_saved_minutes,
          aiGenerations: day.ai_generations,
          templatesUsed: day.templates_used,
          activeTimeMinutes: day.active_time_minutes
        })),
        recentActivity: recentNotes?.map(note => ({
          id: note.id,
          title: note.title,
          type: note.note_type,
          createdAt: note.created_at
        })) || [],
        templateUsage: templateUsage?.map(usage => ({
          usedAt: usage.used_at,
          template: usage.templates
        })) || []
      }
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard analytics'
    });
  }
});

/**
 * GET /api/analytics/productivity
 * Get productivity insights
 */
router.get('/productivity', validateDateRange, handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const { period = 'month' } = req.query;

    // Get productivity metrics
    const { data: productivityData, error } = await supabase
      .rpc('get_user_productivity_insights', {
        p_user_id: userId,
        p_period: period
      });

    if (error) {
      console.error('Productivity insights error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch productivity insights'
      });
    }

    // Get peak usage hours
    const { data: hourlyUsage, error: hourlyError } = await supabase
      .from('notes')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // Process hourly data
    const hourCounts = new Array(24).fill(0);
    hourlyUsage?.forEach(note => {
      const hour = new Date(note.created_at).getHours();
      hourCounts[hour]++;
    });

    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    res.json({
      success: true,
      productivity: {
        insights: productivityData || [],
        peakHours: peakHours.map(({ hour, count }) => ({
          hour: `${hour}:00`,
          notesGenerated: count
        })),
        recommendations: generateProductivityRecommendations(productivityData, peakHours)
      }
    });

  } catch (error) {
    console.error('Productivity analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch productivity analytics'
    });
  }
});

/**
 * GET /api/analytics/organization/:organizationId
 * Get organization analytics (requires manager+ role)
 */
router.get('/organization/:organizationId', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const { organizationId } = req.params;
    const { period = 'month' } = req.query;

    // Check organization access
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership || !['owner', 'admin', 'manager'].includes(membership.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to view organization analytics'
      });
    }

    // Calculate date range
    const end = new Date();
    const start = new Date();
    switch (period) {
      case 'week': start.setDate(start.getDate() - 7); break;
      case 'month': start.setMonth(start.getMonth() - 1); break;
      case 'quarter': start.setMonth(start.getMonth() - 3); break;
      case 'year': start.setFullYear(start.getFullYear() - 1); break;
      default: start.setMonth(start.getMonth() - 1);
    }

    // Get organization analytics
    const { data: orgAnalytics, error: analyticsError } = await supabase
      .from('organization_analytics')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', end.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Get member activity
    const { data: memberActivity, error: memberError } = await supabase
      .from('user_analytics')
      .select(`
        user_id,
        notes_generated,
        credits_used,
        time_saved_minutes,
        user_profiles (
          first_name,
          last_name
        )
      `)
      .eq('organization_id', organizationId)
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', end.toISOString().split('T')[0]);

    // Get template usage
    const { data: templateStats, error: templateError } = await supabase
      .from('template_usage')
      .select(`
        template_id,
        templates (
          name,
          category
        )
      `)
      .eq('organization_id', organizationId)
      .gte('used_at', start.toISOString())
      .lte('used_at', end.toISOString());

    // Process member activity data
    const memberStats = {};
    memberActivity?.forEach(activity => {
      if (!memberStats[activity.user_id]) {
        memberStats[activity.user_id] = {
          userId: activity.user_id,
          firstName: activity.user_profiles?.first_name,
          lastName: activity.user_profiles?.last_name,
          notesGenerated: 0,
          creditsUsed: 0,
          timeSaved: 0
        };
      }
      memberStats[activity.user_id].notesGenerated += activity.notes_generated;
      memberStats[activity.user_id].creditsUsed += activity.credits_used;
      memberStats[activity.user_id].timeSaved += activity.time_saved_minutes;
    });

    // Process template usage
    const templateUsageStats = {};
    templateStats?.forEach(usage => {
      const templateId = usage.template_id;
      if (!templateUsageStats[templateId]) {
        templateUsageStats[templateId] = {
          templateId,
          name: usage.templates?.name,
          category: usage.templates?.category,
          usageCount: 0
        };
      }
      templateUsageStats[templateId].usageCount++;
    });

    res.json({
      success: true,
      analytics: {
        summary: {
          totalMembers: Object.keys(memberStats).length,
          totalNotesGenerated: orgAnalytics?.reduce((sum, day) => sum + day.notes_generated, 0) || 0,
          totalCreditsUsed: orgAnalytics?.reduce((sum, day) => sum + day.credits_used, 0) || 0,
          totalTimeSaved: orgAnalytics?.reduce((sum, day) => sum + day.total_time_saved_minutes, 0) || 0,
          templatesCreated: orgAnalytics?.reduce((sum, day) => sum + day.templates_created, 0) || 0
        },
        dailyData: orgAnalytics?.map(day => ({
          date: day.date,
          activeMembers: day.active_members,
          notesGenerated: day.notes_generated,
          creditsUsed: day.credits_used,
          timeSaved: day.total_time_saved_minutes
        })) || [],
        memberActivity: Object.values(memberStats),
        topTemplates: Object.values(templateUsageStats)
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, 10)
      }
    });

  } catch (error) {
    console.error('Organization analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organization analytics'
    });
  }
});

// Helper function to generate productivity recommendations
function generateProductivityRecommendations(productivityData, peakHours) {
  const recommendations = [];

  // Peak hours recommendation
  if (peakHours.length > 0) {
    const topHour = peakHours[0];
    recommendations.push({
      type: 'peak_hours',
      title: 'Optimize Your Peak Hours',
      description: `You're most productive around ${topHour.hour}. Consider scheduling important note-writing tasks during this time.`,
      priority: 'medium'
    });
  }

  // Template usage recommendation
  recommendations.push({
    type: 'templates',
    title: 'Use More Templates',
    description: 'Templates can save you up to 50% more time. Try creating templates for your most common note types.',
    priority: 'high'
  });

  // Consistency recommendation
  recommendations.push({
    type: 'consistency',
    title: 'Maintain Consistency',
    description: 'Regular note-writing habits lead to better productivity. Try to maintain a consistent schedule.',
    priority: 'low'
  });

  return recommendations;
}

module.exports = router;
