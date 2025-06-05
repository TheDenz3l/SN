/**
 * Admin Panel Routes
 * Comprehensive admin functionality for system management
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
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

// Admin authentication middleware
const requireAdmin = async (req, res, next) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;

    // Check if user has admin role
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error || !profile || !['admin', 'super_admin'].includes(profile.role)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    req.adminRole = profile.role;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify admin access'
    });
  }
};

/**
 * GET /api/admin/dashboard
 * Get admin dashboard overview
 */
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;

    // Get system statistics
    const [
      { count: totalUsers },
      { count: totalOrganizations },
      { count: totalNotes },
      { count: totalTemplates },
      { data: recentUsers },
      { data: systemHealth }
    ] = await Promise.all([
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase.from('notes').select('*', { count: 'exact', head: true }),
      supabase.from('templates').select('*', { count: 'exact', head: true }),
      supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, tier, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.rpc('get_system_health_metrics')
    ]);

    // Get usage statistics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: usageStats } = await supabase
      .from('user_analytics')
      .select('date, notes_generated, credits_used, ai_generations')
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Process usage data by date
    const dailyUsage = {};
    usageStats?.forEach(stat => {
      if (!dailyUsage[stat.date]) {
        dailyUsage[stat.date] = {
          date: stat.date,
          notesGenerated: 0,
          creditsUsed: 0,
          aiGenerations: 0
        };
      }
      dailyUsage[stat.date].notesGenerated += stat.notes_generated;
      dailyUsage[stat.date].creditsUsed += stat.credits_used;
      dailyUsage[stat.date].aiGenerations += stat.ai_generations;
    });

    // Get top organizations by usage
    const { data: topOrgs } = await supabase
      .from('organization_analytics')
      .select(`
        organization_id,
        notes_generated,
        credits_used,
        organizations (
          name,
          status,
          max_members
        )
      `)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('notes_generated', { ascending: false })
      .limit(10);

    // Process top organizations
    const organizationStats = {};
    topOrgs?.forEach(org => {
      const orgId = org.organization_id;
      if (!organizationStats[orgId]) {
        organizationStats[orgId] = {
          id: orgId,
          name: org.organizations?.name,
          status: org.organizations?.status,
          maxMembers: org.organizations?.max_members,
          totalNotes: 0,
          totalCredits: 0
        };
      }
      organizationStats[orgId].totalNotes += org.notes_generated;
      organizationStats[orgId].totalCredits += org.credits_used;
    });

    res.json({
      success: true,
      dashboard: {
        overview: {
          totalUsers: totalUsers || 0,
          totalOrganizations: totalOrganizations || 0,
          totalNotes: totalNotes || 0,
          totalTemplates: totalTemplates || 0
        },
        recentUsers: recentUsers?.map(user => ({
          id: user.user_id,
          firstName: user.first_name,
          lastName: user.last_name,
          tier: user.tier,
          joinedAt: user.created_at
        })) || [],
        usageChart: Object.values(dailyUsage),
        topOrganizations: Object.values(organizationStats)
          .sort((a, b) => b.totalNotes - a.totalNotes)
          .slice(0, 5),
        systemHealth: systemHealth || {}
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin dashboard'
    });
  }
});

/**
 * GET /api/admin/users
 * Get users list with filtering and pagination
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { 
      page = 1, 
      limit = 20, 
      search, 
      tier, 
      status,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    let query = supabase
      .from('user_profiles')
      .select(`
        user_id,
        first_name,
        last_name,
        tier,
        credits,
        has_completed_setup,
        created_at,
        updated_at,
        last_active_at,
        primary_organization_id,
        organizations (
          name
        )
      `);

    // Apply filters
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    if (tier) {
      query = query.eq('tier', tier);
    }

    // Apply sorting
    const validSortFields = ['created_at', 'updated_at', 'last_active_at', 'first_name', 'credits'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? { ascending: true } : { ascending: false };
    
    query = query.order(sortField, order);

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Users fetch error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch users'
      });
    }

    // Get additional user statistics
    const userIds = users?.map(user => user.user_id) || [];
    const { data: userStats } = await supabase
      .from('user_analytics')
      .select('user_id, notes_generated, credits_used')
      .in('user_id', userIds)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Process user statistics
    const statsMap = {};
    userStats?.forEach(stat => {
      if (!statsMap[stat.user_id]) {
        statsMap[stat.user_id] = { notesGenerated: 0, creditsUsed: 0 };
      }
      statsMap[stat.user_id].notesGenerated += stat.notes_generated;
      statsMap[stat.user_id].creditsUsed += stat.credits_used;
    });

    res.json({
      success: true,
      users: users?.map(user => ({
        id: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        tier: user.tier,
        credits: user.credits,
        hasCompletedSetup: user.has_completed_setup,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastActiveAt: user.last_active_at,
        organization: user.organizations ? {
          id: user.primary_organization_id,
          name: user.organizations.name
        } : null,
        stats: statsMap[user.user_id] || { notesGenerated: 0, creditsUsed: 0 }
      })) || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

/**
 * PUT /api/admin/users/:userId
 * Update user profile (admin only)
 */
router.put('/users/:userId', 
  requireAdmin,
  [
    body('tier').optional().isIn(['free', 'paid', 'premium']).withMessage('Invalid tier'),
    body('credits').optional().isInt({ min: 0 }).withMessage('Credits must be non-negative integer'),
    body('role').optional().isIn(['user', 'admin', 'super_admin']).withMessage('Invalid role'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const supabase = req.app.locals.supabase;
      const { userId } = req.params;
      const { tier, credits, role, firstName, lastName } = req.body;

      // Only super_admin can change roles
      if (role && req.adminRole !== 'super_admin') {
        return res.status(403).json({
          success: false,
          error: 'Only super admin can change user roles'
        });
      }

      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (tier !== undefined) updateData.tier = tier;
      if (credits !== undefined) updateData.credits = credits;
      if (role !== undefined) updateData.role = role;
      if (firstName !== undefined) updateData.first_name = firstName;
      if (lastName !== undefined) updateData.last_name = lastName;

      const { data: updatedUser, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('User update error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to update user'
        });
      }

      res.json({
        success: true,
        message: 'User updated successfully',
        user: {
          id: updatedUser.user_id,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          tier: updatedUser.tier,
          credits: updatedUser.credits,
          role: updatedUser.role,
          updatedAt: updatedUser.updated_at
        }
      });

    } catch (error) {
      console.error('Admin user update error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update user'
      });
    }
  }
);

/**
 * GET /api/admin/organizations
 * Get organizations list
 */
router.get('/organizations', requireAdmin, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { page = 1, limit = 20, search, status } = req.query;

    let query = supabase
      .from('organizations')
      .select(`
        *,
        organization_members (count)
      `);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data: organizations, error, count } = await query;

    if (error) {
      console.error('Organizations fetch error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch organizations'
      });
    }

    res.json({
      success: true,
      organizations: organizations?.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        description: org.description,
        status: org.status,
        maxMembers: org.max_members,
        maxCredits: org.max_credits,
        memberCount: org.organization_members[0]?.count || 0,
        createdAt: org.created_at,
        updatedAt: org.updated_at
      })) || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Admin organizations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organizations'
    });
  }
});

/**
 * POST /api/admin/setup/database
 * Initialize database schema and tables
 */
router.post('/setup/database', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const fs = require('fs');
    const path = require('path');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../../database-schema.sql');

    if (!fs.existsSync(sqlFilePath)) {
      return res.status(404).json({
        success: false,
        error: 'Database setup SQL file not found'
      });
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        });

        if (error) {
          console.warn(`⚠️ Warning on statement ${i + 1}:`, error.message);
        }
      } catch (err) {
        console.warn(`⚠️ Warning on statement ${i + 1}:`, err.message);
      }
    }

    // Verify tables exist
    const tables = ['user_profiles', 'isp_tasks', 'notes', 'note_sections', 'user_credits', 'templates', 'organizations'];
    const tableStatus = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        tableStatus[table] = !error;
      } catch (err) {
        tableStatus[table] = false;
      }
    }

    const allTablesExist = Object.values(tableStatus).every(exists => exists);

    res.json({
      success: true,
      message: 'Database setup completed',
      tableStatus,
      allTablesExist
    });

  } catch (error) {
    console.error('Database setup error:', error);
    res.status(500).json({
      success: false,
      error: 'Database setup failed: ' + error.message
    });
  }
});

/**
 * GET /api/admin/system/health
 * Get detailed system health information
 */
router.get('/system/health', requireAdmin, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;

    // Get database health
    const { data: dbHealth, error: dbError } = await supabase
      .rpc('get_database_health');

    // Get API health metrics
    const { performanceMetrics } = require('../middleware/errorTracking');
    const apiMetrics = performanceMetrics.getMetrics();

    // Get recent errors
    const { data: recentErrors } = await supabase
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      success: true,
      health: {
        database: dbHealth || { status: 'unknown' },
        api: {
          ...apiMetrics,
          status: apiMetrics.totalErrors < 100 ? 'healthy' : 'warning'
        },
        recentErrors: recentErrors || []
      }
    });

  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system health'
    });
  }
});

module.exports = router;
