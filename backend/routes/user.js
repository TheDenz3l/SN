/**
 * User Routes for SwiftNotes
 * Handles user profile management, setup completion, and user data
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const WritingAnalyticsService = require('../services/writingAnalyticsService');
const router = express.Router();

// Validation middleware
const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('writingStyle')
    .optional()
    .trim()
    .isLength({ min: 100, max: 3000 })
    .withMessage('Writing style must be between 100 and 3000 characters')
];

const validateSetupCompletion = [
  body('writingStyle')
    .trim()
    .isLength({ min: 100, max: 3000 })
    .withMessage('Writing style must be between 100 and 3000 characters'),
  body('ispTasks')
    .isArray({ min: 1 })
    .withMessage('At least one ISP task is required'),
  body('ispTasks.*.description')
    .trim()
    .isLength({ min: 1, max: 3000 })
    .withMessage('ISP task description must be between 1 and 3000 characters')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', {
      url: req.url,
      method: req.method,
      body: req.body,
      errors: errors.array()
    });
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * GET /api/user/profile
 * Get current user profile
 */
router.get('/profile', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;

    // First check if there are multiple profiles (debugging)
    const { data: allProfiles, error: checkError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId);

    if (checkError) {
      console.error('Profile check error:', checkError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch user profile'
      });
    }

    if (allProfiles.length > 1) {
      console.warn(`Multiple profiles found for user ${userId}:`, allProfiles.length);
      // Use the most recent profile
      const profile = allProfiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      console.log('Using most recent profile:', profile.id);
    } else if (allProfiles.length === 0) {
      console.error('No profile found for user:', userId);
      return res.status(500).json({
        success: false,
        error: 'User profile not found'
      });
    }

    const profile = allProfiles[0];

    res.json({
      success: true,
      user: {
        id: userId,
        email: req.user.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        tier: profile.tier,
        credits: profile.credits,
        hasCompletedSetup: profile.has_completed_setup,
        writingStyle: profile.writing_style,
        preferences: profile.preferences,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

/**
 * PUT /api/user/profile
 * Update user profile
 */
router.put('/profile', validateProfileUpdate, handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const { firstName, lastName, writingStyle } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (writingStyle !== undefined) updateData.writing_style = writingStyle;

    // Handle potential duplicate profiles by updating all and getting the first
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select();

    const profile = profiles && profiles.length > 0 ? profiles[0] : null;

    if (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: userId,
        email: req.user.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        tier: profile.tier,
        credits: profile.credits,
        hasCompletedSetup: profile.has_completed_setup,
        writingStyle: profile.writing_style,
        updatedAt: profile.updated_at
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

/**
 * POST /api/user/complete-setup
 * Complete user setup with writing style and ISP tasks
 */
router.post('/complete-setup', validateSetupCompletion, handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const { writingStyle, ispTasks } = req.body;

    // Debug logging
    console.log('Setup completion request:', {
      userId,
      writingStyleLength: writingStyle?.length,
      ispTasksCount: ispTasks?.length,
      ispTasks: ispTasks?.map(task => ({ description: task.description, length: task.description?.length }))
    });

    // Analyze writing style quality
    const analyticsService = new WritingAnalyticsService(supabase);
    const styleAnalysis = analyticsService.analyzeWritingStyleQuality(writingStyle);

    // Calculate initial confidence based on analysis
    let initialConfidence = 0.50; // Default
    if (styleAnalysis.quality === 'excellent') {
      initialConfidence = 0.80;
    } else if (styleAnalysis.quality === 'good') {
      initialConfidence = 0.65;
    } else if (styleAnalysis.quality === 'fair') {
      initialConfidence = 0.50;
    } else {
      initialConfidence = 0.35;
    }

    // Determine confidence level
    let confidenceLevel = 'medium';
    if (initialConfidence >= 0.75) {
      confidenceLevel = 'high';
    } else if (initialConfidence >= 0.50) {
      confidenceLevel = 'medium';
    } else {
      confidenceLevel = 'low';
    }

    // Start transaction-like operations
    try {
      // Update user profile with writing style and setup completion
      // Only update fields that exist in the current schema
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .update({
          writing_style: writingStyle,
          has_completed_setup: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select();

      const updatedProfile = profileData && profileData.length > 0 ? profileData[0] : null;

      if (profileError) {
        throw new Error(`Profile update failed: ${profileError.message}`);
      }

      if (!updatedProfile) {
        throw new Error('Profile update failed: No profile data returned');
      }

      // Delete existing ISP tasks for this user
      await supabase
        .from('isp_tasks')
        .delete()
        .eq('user_id', userId);

      // Insert new ISP tasks
      const ispTasksData = ispTasks.map((task, index) => ({
        user_id: userId,
        description: task.description,
        order_index: index
      }));

      const { data: createdTasks, error: tasksError } = await supabase
        .from('isp_tasks')
        .insert(ispTasksData)
        .select();

      if (tasksError) {
        throw new Error(`ISP tasks creation failed: ${tasksError.message}`);
      }

      res.json({
        success: true,
        message: 'Setup completed successfully',
        user: {
          id: userId,
          email: req.user.email,
          firstName: updatedProfile.first_name,
          lastName: updatedProfile.last_name,
          tier: updatedProfile.tier,
          credits: updatedProfile.credits,
          hasCompletedSetup: updatedProfile.has_completed_setup,
          writingStyle: updatedProfile.writing_style,
          writingStyleConfidence: initialConfidence, // Use calculated value
          styleConfidenceLevel: confidenceLevel, // Use calculated value
          updatedAt: updatedProfile.updated_at
        },
        ispTasks: createdTasks,
        styleAnalysis: {
          quality: styleAnalysis.quality,
          score: styleAnalysis.score,
          confidence: initialConfidence,
          confidenceLevel: confidenceLevel,
          suggestions: styleAnalysis.suggestions,
          strengths: styleAnalysis.strengths
        }
      });

    } catch (transactionError) {
      console.error('Setup transaction error:', transactionError);
      return res.status(500).json({
        success: false,
        error: transactionError.message
      });
    }

  } catch (error) {
    console.error('Setup completion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete setup'
    });
  }
});

/**
 * GET /api/user/credits
 * Get user credit information
 */
router.get('/credits', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;

    // Get current credits - handle potential duplicates
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('credits, tier')
      .eq('user_id', userId);

    const profile = profiles && profiles.length > 0 ? profiles[0] : null;

    if (profileError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch credit information'
      });
    }

    // Get recent credit transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      success: true,
      credits: {
        current: profile.credits,
        tier: profile.tier,
        transactions: transactions || []
      }
    });

  } catch (error) {
    console.error('Credits fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credit information'
    });
  }
});

/**
 * GET /api/user/usage
 * Get comprehensive user usage statistics
 */
router.get('/usage', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;

    // Get comprehensive notes statistics
    const { data: notesStats, error: notesError } = await supabase
      .from('notes')
      .select('tokens_used, cost, created_at, note_type')
      .eq('user_id', userId);

    if (notesError) {
      console.error('Notes stats error:', notesError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch notes statistics'
      });
    }

    // Calculate comprehensive statistics
    const totalNotes = notesStats?.length || 0;
    const totalTokens = notesStats?.reduce((sum, note) => sum + (note.tokens_used || 0), 0) || 0;
    const totalCost = notesStats?.reduce((sum, note) => sum + (parseFloat(note.cost) || 0), 0) || 0;

    // Calculate time-based statistics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const recentNotes = notesStats?.filter(note => new Date(note.created_at) >= thirtyDaysAgo) || [];
    const weeklyNotes = notesStats?.filter(note => new Date(note.created_at) >= sevenDaysAgo) || [];
    const todayNotes = notesStats?.filter(note => new Date(note.created_at) >= today) || [];

    // Calculate note type distribution
    const noteTypeStats = {};
    notesStats?.forEach(note => {
      noteTypeStats[note.note_type] = (noteTypeStats[note.note_type] || 0) + 1;
    });

    // Calculate monthly breakdown for the last 6 months
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthNotes = notesStats?.filter(note => {
        const noteDate = new Date(note.created_at);
        return noteDate >= monthStart && noteDate <= monthEnd;
      }) || [];

      monthlyStats.push({
        month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
        notes: monthNotes.length,
        tokens: monthNotes.reduce((sum, note) => sum + (note.tokens_used || 0), 0),
        cost: monthNotes.reduce((sum, note) => sum + (parseFloat(note.cost) || 0), 0)
      });
    }

    // Get user analytics data if available
    const { data: analyticsData } = await supabase
      .from('user_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });

    const totalTimeSaved = analyticsData?.reduce((sum, day) => sum + (day.time_saved_minutes || 0), 0) || 0;
    const totalAIGenerations = analyticsData?.reduce((sum, day) => sum + (day.ai_generations || 0), 0) || 0;

    res.json({
      success: true,
      usage: {
        // Overall statistics
        totalNotes,
        totalTokens,
        totalCost: parseFloat(totalCost.toFixed(6)),
        tier: req.user.tier,
        credits: req.user.credits,

        // Time-based statistics
        recentNotes: recentNotes.length,
        weeklyNotes: weeklyNotes.length,
        todayNotes: todayNotes.length,

        // Additional metrics
        totalTimeSavedHours: Math.round(totalTimeSaved / 60 * 10) / 10,
        totalAIGenerations,
        averageTokensPerNote: totalNotes > 0 ? Math.round(totalTokens / totalNotes) : 0,
        averageCostPerNote: totalNotes > 0 ? parseFloat((totalCost / totalNotes).toFixed(6)) : 0,

        // Breakdowns
        noteTypeDistribution: noteTypeStats,
        monthlyBreakdown: monthlyStats,

        // Recent activity
        recentActivity: {
          last30Days: recentNotes.length,
          last7Days: weeklyNotes.length,
          today: todayNotes.length
        }
      }
    });

  } catch (error) {
    console.error('Usage fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage statistics'
    });
  }
});

/**
 * PUT /api/user/change-password
 * Change user password
 */
router.put('/change-password', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    // Get user email for authentication
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword
    });

    if (signInError) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (updateError) {
      console.error('❌ Error updating password:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update password'
      });
    }

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('❌ Error in change password:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/user/writing-style
 * Update user writing style
 */
router.put('/writing-style', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const { writingStyle } = req.body;

    // Validate input
    if (!writingStyle || writingStyle.length < 100) {
      return res.status(400).json({
        success: false,
        error: 'Writing style must be at least 100 characters long'
      });
    }

    if (writingStyle.length > 3000) {
      return res.status(400).json({
        success: false,
        error: 'Writing style must be less than 3000 characters'
      });
    }

    // Update writing style
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        writing_style: writingStyle,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Error updating writing style:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update writing style'
      });
    }

    res.json({
      success: true,
      message: 'Writing style updated successfully'
    });

  } catch (error) {
    console.error('❌ Error in update writing style:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/user/preferences
 * Update user preferences
 */
router.put('/preferences', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const { defaultToneLevel, defaultDetailLevel, emailNotifications, weeklyReports } = req.body;

    // Get current preferences
    const { data: currentProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching current preferences:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch current preferences'
      });
    }

    // Parse current preferences or start with empty object
    let preferences = {};
    try {
      preferences = currentProfile.preferences ? JSON.parse(currentProfile.preferences) : {};
    } catch (parseError) {
      console.warn('⚠️ Error parsing current preferences, starting fresh:', parseError);
      preferences = {};
    }

    // Validate and update preferences
    if (defaultToneLevel !== undefined && defaultToneLevel !== null) {
      if (typeof defaultToneLevel !== 'number' || isNaN(defaultToneLevel) || defaultToneLevel < 0 || defaultToneLevel > 100) {
        return res.status(400).json({
          success: false,
          error: 'Default tone level must be a number between 0 and 100'
        });
      }
      preferences.defaultToneLevel = defaultToneLevel;
    }

    if (defaultDetailLevel !== undefined) {
      const validLevels = ['brief', 'moderate', 'detailed', 'comprehensive'];
      if (!validLevels.includes(defaultDetailLevel)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid detail level'
        });
      }
      preferences.defaultDetailLevel = defaultDetailLevel;
    }

    if (emailNotifications !== undefined) {
      preferences.emailNotifications = emailNotifications;
    }

    if (weeklyReports !== undefined) {
      preferences.weeklyReports = weeklyReports;
    }

    // Update preferences in database
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        preferences: JSON.stringify(preferences),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Error updating preferences:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update preferences'
      });
    }

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences
    });

  } catch (error) {
    console.error('❌ Error in update preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/user/export-data
 * Export user data
 */
router.get('/export-data', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile for export:', profileError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch profile data'
      });
    }

    // Get user notes
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (notesError) {
      console.error('❌ Error fetching notes for export:', notesError);
    }

    // Get ISP tasks
    const { data: ispTasks, error: tasksError } = await supabase
      .from('isp_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (tasksError) {
      console.error('❌ Error fetching ISP tasks for export:', tasksError);
    }

    // Compile export data
    const exportData = {
      profile: {
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        hasCompletedSetup: profile.has_completed_setup,
        writingStyle: profile.writing_style,
        credits: profile.credits,
        defaultToneLevel: profile.default_tone_level,
        defaultDetailLevel: profile.default_detail_level,
        emailNotifications: profile.email_notifications,
        weeklyReports: profile.weekly_reports,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      },
      notes: notes || [],
      ispTasks: ispTasks || [],
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0'
    };

    res.json({
      success: true,
      data: exportData
    });

  } catch (error) {
    console.error('❌ Error in export data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/user/delete-account
 * Delete user account (soft delete)
 */
router.delete('/delete-account', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;

    // In a real implementation, you might want to soft delete or anonymize data
    // For now, we'll just mark the user as deleted
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        deleted_at: new Date().toISOString(),
        email: `deleted_${userId}@deleted.com` // Anonymize email
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Error soft deleting user:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete account'
      });
    }

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error in delete account:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/user/account
 * Delete user account (soft delete)
 */
router.delete('/account', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;

    // In a real implementation, you might want to soft delete or anonymize data
    // For now, we'll just mark the profile as deleted
    const { error } = await supabase
      .from('user_profiles')
      .update({
        first_name: null,
        last_name: null,
        writing_style: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete account'
      });
    }

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

module.exports = router;
