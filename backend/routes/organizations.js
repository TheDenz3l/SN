/**
 * Organization Management Routes
 * Handles team/organizational accounts, invitations, and member management
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const crypto = require('crypto');
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
const validateOrganizationCreation = [
  body('name').trim().isLength({ min: 2, max: 255 }).withMessage('Organization name must be 2-255 characters'),
  body('slug').trim().isLength({ min: 2, max: 100 }).matches(/^[a-z0-9-]+$/).withMessage('Slug must be lowercase alphanumeric with hyphens'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
];

const validateInvitation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn(['admin', 'manager', 'member', 'viewer']).withMessage('Invalid role'),
];

const validateMemberUpdate = [
  body('role').isIn(['admin', 'manager', 'member', 'viewer']).withMessage('Invalid role'),
];

// Middleware to check organization membership and permissions
const checkOrganizationAccess = (requiredRole = 'member') => {
  return async (req, res, next) => {
    try {
      const supabase = req.app.locals.supabase;
      const userId = req.user.id;
      const organizationId = req.params.organizationId || req.body.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required'
        });
      }

      // Check if user is a member of the organization
      const { data: membership, error } = await supabase
        .from('organization_members')
        .select('role, organization_id')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single();

      if (error || !membership) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Not a member of this organization'
        });
      }

      // Check role permissions
      const roleHierarchy = { viewer: 1, member: 2, manager: 3, admin: 4, owner: 5 };
      const userRoleLevel = roleHierarchy[membership.role] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({
          success: false,
          error: `Access denied: ${requiredRole} role required`
        });
      }

      req.organizationMembership = membership;
      next();
    } catch (error) {
      console.error('Organization access check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify organization access'
      });
    }
  };
};

/**
 * GET /api/organizations
 * Get user's organizations
 */
router.get('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;

    const { data: organizations, error } = await supabase
      .from('organization_members')
      .select(`
        role,
        joined_at,
        last_active_at,
        organizations (
          id,
          name,
          slug,
          description,
          status,
          max_members,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Organizations fetch error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch organizations'
      });
    }

    res.json({
      success: true,
      organizations: organizations.map(org => ({
        ...org.organizations,
        userRole: org.role,
        joinedAt: org.joined_at,
        lastActiveAt: org.last_active_at
      }))
    });

  } catch (error) {
    console.error('Organizations list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organizations'
    });
  }
});

/**
 * POST /api/organizations
 * Create a new organization
 */
router.post('/', validateOrganizationCreation, handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const { name, slug, description } = req.body;

    // Check if slug is already taken
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingOrg) {
      return res.status(409).json({
        success: false,
        error: 'Organization slug already exists'
      });
    }

    // Create organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        description,
        status: 'trial'
      })
      .select()
      .single();

    if (orgError) {
      console.error('Organization creation error:', orgError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create organization'
      });
    }

    // Add creator as owner
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organization.id,
        user_id: userId,
        role: 'owner'
      });

    if (memberError) {
      console.error('Organization member creation error:', memberError);
      // Try to clean up the organization
      await supabase.from('organizations').delete().eq('id', organization.id);
      return res.status(500).json({
        success: false,
        error: 'Failed to create organization membership'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      organization: {
        ...organization,
        userRole: 'owner'
      }
    });

  } catch (error) {
    console.error('Organization creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create organization'
    });
  }
});

/**
 * GET /api/organizations/:organizationId
 * Get organization details
 */
router.get('/:organizationId', checkOrganizationAccess('member'), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { organizationId } = req.params;

    // Get organization details with member count
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select(`
        *,
        organization_members (count)
      `)
      .eq('id', organizationId)
      .single();

    if (orgError) {
      console.error('Organization fetch error:', orgError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch organization'
      });
    }

    // Get recent analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('organization_analytics')
      .select('*')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false })
      .limit(30);

    res.json({
      success: true,
      organization: {
        ...organization,
        memberCount: organization.organization_members[0]?.count || 0,
        userRole: req.organizationMembership.role,
        analytics: analytics || []
      }
    });

  } catch (error) {
    console.error('Organization details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organization details'
    });
  }
});

/**
 * GET /api/organizations/:organizationId/members
 * Get organization members
 */
router.get('/:organizationId/members', checkOrganizationAccess('member'), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { organizationId } = req.params;

    const { data: members, error } = await supabase
      .from('organization_members')
      .select(`
        id,
        role,
        joined_at,
        last_active_at,
        user_profiles (
          first_name,
          last_name,
          tier,
          created_at
        )
      `)
      .eq('organization_id', organizationId)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Members fetch error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch organization members'
      });
    }

    res.json({
      success: true,
      members: members.map(member => ({
        id: member.id,
        role: member.role,
        joinedAt: member.joined_at,
        lastActiveAt: member.last_active_at,
        firstName: member.user_profiles?.first_name,
        lastName: member.user_profiles?.last_name,
        tier: member.user_profiles?.tier,
        memberSince: member.user_profiles?.created_at
      }))
    });

  } catch (error) {
    console.error('Organization members error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organization members'
    });
  }
});

/**
 * POST /api/organizations/:organizationId/invite
 * Invite user to organization
 */
router.post('/:organizationId/invite', 
  checkOrganizationAccess('manager'), 
  validateInvitation, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const supabase = req.app.locals.supabase;
      const { organizationId } = req.params;
      const { email, role } = req.body;
      const inviterId = req.user.id;

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', (await supabase.auth.admin.getUserByEmail(email)).data?.user?.id)
        .single();

      if (existingMember) {
        return res.status(409).json({
          success: false,
          error: 'User is already a member of this organization'
        });
      }

      // Check if invitation already exists
      const { data: existingInvitation } = await supabase
        .from('organization_invitations')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('email', email)
        .single();

      if (existingInvitation) {
        return res.status(409).json({
          success: false,
          error: 'Invitation already sent to this email'
        });
      }

      // Generate invitation token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Create invitation
      const { data: invitation, error } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: organizationId,
          email,
          role,
          invited_by: inviterId,
          token,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Invitation creation error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to create invitation'
        });
      }

      // TODO: Send invitation email
      console.log(`Invitation created for ${email} with token: ${token}`);

      res.status(201).json({
        success: true,
        message: 'Invitation sent successfully',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expires_at
        }
      });

    } catch (error) {
      console.error('Organization invitation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send invitation'
      });
    }
  }
);

module.exports = router;
