/**
 * Authentication Routes for SwiftNotes
 * Handles user registration, login, logout, and password reset
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Validation middleware
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

// Helper function to handle validation errors
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

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', validateRegistration, handleValidationErrors, async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const supabase = req.app.locals.supabase;

    // Check if user already exists by trying to get user by email
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(user => user.email === email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create user in Supabase Auth with metadata (trigger will create profile automatically)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for development
      user_metadata: {
        first_name: firstName || null,
        last_name: lastName || null
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return res.status(400).json({
        success: false,
        error: authError.message
      });
    }

    console.log(`Created auth user: ${authData.user.id} with email: ${authData.user.email}`);
    console.log('User metadata:', authData.user.user_metadata);

    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 200));

    // Get the profile created by the trigger
    let profile;
    let retries = 3;
    while (retries > 0) {
      try {
        const { data: profilesData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', authData.user.id);

        const profileData = profilesData && profilesData.length > 0 ? profilesData[0] : null;

        if (profileError || !profileData) {
          // If profile doesn't exist, create it manually as fallback
          if (!profileData || profileError?.code === 'PGRST116') {
            console.log('Profile not found, creating manually as fallback...');

            try {
              // Create a client with the user's session for RLS compliance
              const { createClient } = require('@supabase/supabase-js');
              const userSupabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_ANON_KEY
              );

              // Set the user's session
              await userSupabase.auth.setSession({
                access_token: authData.session.access_token,
                refresh_token: authData.session.refresh_token
              });

              const { data: createdProfile, error: createError } = await userSupabase
                .from('user_profiles')
                .insert({
                  user_id: authData.user.id,
                  first_name: firstName || null,
                  last_name: lastName || null,
                  tier: 'free',
                  credits: 10,
                  has_completed_setup: false
                })
                .select()
                .single();

              if (createError) {
                throw createError;
              }

              // Also create initial credit transaction
              await userSupabase
                .from('user_credits')
                .insert({
                  user_id: authData.user.id,
                  transaction_type: 'bonus',
                  amount: 10,
                  description: 'Welcome bonus - free tier starting credits'
                });

              profile = createdProfile;
              console.log('Profile created with user context:', profile.id);
              break;
            } catch (createError) {
              console.error('Manual profile creation failed:', createError);
              if (retries > 1) {
                retries--;
                await new Promise(resolve => setTimeout(resolve, 200));
                continue;
              }
              throw new Error(`Profile creation failed: ${createError.message}`);
            }
          } else {
            throw new Error(`Profile fetch failed: ${profileError.message}`);
          }
        }

        profile = profileData;
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          console.error('Profile fetch error after retries:', error);

          // Clean up auth user if profile fetch fails
          try {
            await supabase.auth.admin.deleteUser(authData.user.id);
            console.log(`Cleaned up auth user ${authData.user.id} after profile fetch failure`);
          } catch (cleanupError) {
            console.error('Failed to cleanup auth user:', cleanupError);
          }

          return res.status(500).json({
            success: false,
            error: 'Failed to create user profile. Please try again.'
          });
        }
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Generate a session token for the user
    const token = Buffer.from(JSON.stringify({
      userId: authData.user.id,
      email: authData.user.email,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    })).toString('base64');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        tier: profile.tier,
        credits: profile.credits,
        hasCompletedSetup: profile.has_completed_setup,
        writingStyle: profile.writing_style
      },
      session: {
        access_token: token,
        refresh_token: token,
        expires_at: Date.now() + (24 * 60 * 60 * 1000)
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again.'
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return session
 */
router.post('/login', validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;
    const supabase = req.app.locals.supabase;

    // Try to sign in with Supabase to verify credentials
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const user = authData.user;

    // Get user profile - handle potential duplicates
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id);

    let profile = profiles && profiles.length > 0 ? profiles[0] : null;

    if (profileError || !profile) {
      // If profile doesn't exist, try to create it instead of deleting the user
      if (!profile || profileError?.code === 'PGRST116') {
        console.log(`User ${user.email} exists in auth but has no profile. Creating profile...`);

        try {
          // Create profile for existing user
          const { data: createdProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              first_name: user.user_metadata?.first_name || null,
              last_name: user.user_metadata?.last_name || null,
              tier: 'free',
              credits: 10,
              has_completed_setup: false
            })
            .select()
            .single();

          if (createError) {
            console.error('Profile creation failed during login:', createError);
            return res.status(500).json({
              success: false,
              error: 'Failed to create user profile'
            });
          }

          // Use the newly created profile
          profile = createdProfile;
          console.log('Profile created during login for user:', user.email);
        } catch (createError) {
          console.error('Profile creation error during login:', createError);
          return res.status(500).json({
            success: false,
            error: 'Failed to create user profile'
          });
        }
      } else {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch user profile'
        });
      }
    }

    // For development, we'll create a simple JWT-like token
    // In production, you'd want to use proper JWT signing
    const token = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    })).toString('base64');

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        tier: profile.tier,
        credits: profile.credits,
        hasCompletedSetup: profile.has_completed_setup,
        writingStyle: profile.writing_style
      },
      session: {
        access_token: token,
        refresh_token: token,
        expires_at: Date.now() + (24 * 60 * 60 * 1000)
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const supabase = req.app.locals.supabase;
      
      // Sign out the user
      await supabase.auth.admin.signOut(token);
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Send password reset email
 */
router.post('/forgot-password', validatePasswordReset, handleValidationErrors, async (req, res) => {
  try {
    const { email } = req.body;
    const supabase = req.app.locals.supabase;

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });

    if (error) {
      console.error('Password reset error:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Password reset email sent successfully'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send password reset email'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const supabase = req.app.locals.supabase;
    
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    res.json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
});

module.exports = router;
