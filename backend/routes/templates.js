/**
 * Template Library Routes
 * Handles template creation, sharing, and management
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

// Validation rules
const validateTemplateCreation = [
  body('name').trim().isLength({ min: 2, max: 255 }).withMessage('Template name must be 2-255 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('category').isIn(['isp', 'progress_note', 'assessment', 'treatment_plan', 'custom']).withMessage('Invalid category'),
  body('visibility').isIn(['private', 'team', 'organization', 'public']).withMessage('Invalid visibility'),
  body('content').isObject().withMessage('Content must be a valid object'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
];

const validateTemplateUpdate = [
  body('name').optional().trim().isLength({ min: 2, max: 255 }).withMessage('Template name must be 2-255 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('category').optional().isIn(['isp', 'progress_note', 'assessment', 'treatment_plan', 'custom']).withMessage('Invalid category'),
  body('visibility').optional().isIn(['private', 'team', 'organization', 'public']).withMessage('Invalid visibility'),
  body('content').optional().isObject().withMessage('Content must be a valid object'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
];

/**
 * GET /api/templates
 * Get templates accessible to the user
 */
router.get('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const { 
      category, 
      visibility, 
      search, 
      tags, 
      organizationId,
      page = 1, 
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    let query = supabase
      .from('templates')
      .select(`
        id,
        name,
        description,
        category,
        visibility,
        tags,
        usage_count,
        is_featured,
        version,
        created_at,
        updated_at,
        created_by,
        organization_id,

        organizations (
          name
        )
      `);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (visibility) {
      query = query.eq('visibility', visibility);
    }

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (tags && Array.isArray(tags)) {
      query = query.overlaps('tags', tags);
    }

    // Apply sorting
    const validSortFields = ['created_at', 'updated_at', 'name', 'usage_count'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? { ascending: true } : { ascending: false };
    
    query = query.order(sortField, order);

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data: templates, error, count } = await query;

    if (error) {
      console.error('Templates fetch error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch templates'
      });
    }

    // Get user's organization memberships for access control
    const { data: userOrgs } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId);

    const userOrgIds = userOrgs?.map(org => org.organization_id) || [];

    // Filter templates based on access permissions
    const accessibleTemplates = templates.filter(template => {
      // Public templates are always accessible
      if (template.visibility === 'public') return true;
      
      // User's own templates are always accessible
      if (template.created_by === userId) return true;
      
      // Organization/team templates require membership
      if (template.visibility === 'organization' || template.visibility === 'team') {
        return template.organization_id && userOrgIds.includes(template.organization_id);
      }
      
      // Private templates are only accessible to creator
      return false;
    });

    res.json({
      success: true,
      templates: accessibleTemplates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        visibility: template.visibility,
        tags: template.tags,
        usageCount: template.usage_count,
        isFeatured: template.is_featured,
        version: template.version,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
        createdBy: {
          id: template.created_by,
          firstName: null,
          lastName: null
        },
        organization: template.organizations ? {
          id: template.organization_id,
          name: template.organizations.name
        } : null
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: accessibleTemplates.length,
        totalPages: Math.ceil(accessibleTemplates.length / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Templates list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates'
    });
  }
});

/**
 * POST /api/templates
 * Create a new template
 */
router.post('/', validateTemplateCreation, handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const { name, description, category, visibility, content, tags, organizationId } = req.body;

    // Validate organization access if creating org template
    if (organizationId && (visibility === 'organization' || visibility === 'team')) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single();

      if (!membership || !['owner', 'admin', 'manager'].includes(membership.role)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions to create organization templates'
        });
      }
    }

    // Create template
    const { data: template, error } = await supabase
      .from('templates')
      .insert({
        name,
        description,
        category,
        visibility,
        content,
        tags: tags || [],
        created_by: userId,
        organization_id: organizationId || null
      })
      .select(`
        *,

        organizations (
          name
        )
      `)
      .single();

    if (error) {
      console.error('Template creation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create template'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        visibility: template.visibility,
        content: template.content,
        tags: template.tags,
        usageCount: template.usage_count,
        isFeatured: template.is_featured,
        version: template.version,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
        createdBy: {
          id: template.created_by,
          firstName: null,
          lastName: null
        },
        organization: template.organizations ? {
          id: template.organization_id,
          name: template.organizations.name
        } : null
      }
    });

  } catch (error) {
    console.error('Template creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create template'
    });
  }
});

/**
 * GET /api/templates/:templateId
 * Get template details
 */
router.get('/:templateId', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const { templateId } = req.params;

    const { data: template, error } = await supabase
      .from('templates')
      .select(`
        *,

        organizations (
          name
        )
      `)
      .eq('id', templateId)
      .single();

    if (error) {
      console.error('Template fetch error:', error);
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    // Check access permissions
    let hasAccess = false;

    if (template.visibility === 'public' || template.created_by === userId) {
      hasAccess = true;
    } else if (template.visibility === 'organization' || template.visibility === 'team') {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', template.organization_id)
        .eq('user_id', userId)
        .single();
      
      hasAccess = !!membership;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this template'
      });
    }

    res.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        visibility: template.visibility,
        content: template.content,
        tags: template.tags,
        usageCount: template.usage_count,
        isFeatured: template.is_featured,
        version: template.version,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
        createdBy: {
          id: template.created_by,
          firstName: null,
          lastName: null
        },
        organization: template.organizations ? {
          id: template.organization_id,
          name: template.organizations.name
        } : null
      }
    });

  } catch (error) {
    console.error('Template details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template details'
    });
  }
});

/**
 * POST /api/templates/:templateId/use
 * Record template usage
 */
router.post('/:templateId/use', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const { templateId } = req.params;
    const { modifications, noteId } = req.body;

    // Get user's organization
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('primary_organization_id')
      .eq('user_id', userId)
      .single();

    // Record template usage
    const { error: usageError } = await supabase
      .from('template_usage')
      .insert({
        template_id: templateId,
        user_id: userId,
        organization_id: userProfile?.primary_organization_id,
        modifications,
        generated_note_id: noteId
      });

    if (usageError) {
      console.error('Template usage recording error:', usageError);
    }

    // Increment usage count
    const { error: updateError } = await supabase
      .from('templates')
      .update({ 
        usage_count: supabase.raw('usage_count + 1'),
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId);

    if (updateError) {
      console.error('Template usage count update error:', updateError);
    }

    res.json({
      success: true,
      message: 'Template usage recorded'
    });

  } catch (error) {
    console.error('Template usage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record template usage'
    });
  }
});

module.exports = router;
