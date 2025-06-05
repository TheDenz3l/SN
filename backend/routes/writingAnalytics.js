/**
 * Writing Analytics Routes for SwiftNotes
 * Handles writing style learning and analytics endpoints
 */

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const WritingAnalyticsService = require('../services/writingAnalyticsService');
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
const validateAnalyticsLog = [
  body('noteId').isUUID().withMessage('Valid note ID is required'),
  body('noteSectionId').optional().isUUID().withMessage('Note section ID must be a valid UUID'),
  body('originalGenerated').trim().isLength({ min: 1 }).withMessage('Original generated content is required'),
  body('userEditedVersion').optional().trim(),
  body('editType').optional().isIn(['minor', 'major', 'style_change', 'content_addition', 'complete_rewrite']),
  body('confidenceScore').optional().isFloat({ min: 0, max: 1 }).withMessage('Confidence score must be between 0 and 1'),
  body('userSatisfactionScore').optional().isInt({ min: 1, max: 5 }).withMessage('Satisfaction score must be between 1 and 5'),
  body('feedbackNotes').optional().trim().isLength({ max: 1000 }).withMessage('Feedback notes must be less than 1000 characters'),
  body('tokensUsed').optional().isInt({ min: 0 }).withMessage('Tokens used must be a positive integer'),
  body('generationTimeMs').optional().isInt({ min: 0 }).withMessage('Generation time must be a positive integer'),
  body('styleMatchScore').optional().isFloat({ min: 0, max: 1 }).withMessage('Style match score must be between 0 and 1')
];

const validateStyleEvolution = [
  body('newStyle').trim().isLength({ min: 100, max: 3000 }).withMessage('New style must be between 100 and 3000 characters'),
  body('triggerReason').trim().isLength({ min: 1, max: 500 }).withMessage('Trigger reason is required and must be less than 500 characters'),
  body('notesAnalyzed').optional().isInt({ min: 0 }).withMessage('Notes analyzed must be a positive integer'),
  body('improvementMetrics').optional().isObject().withMessage('Improvement metrics must be an object')
];

/**
 * POST /api/writing-analytics/log
 * Log analytics data for a generated note section
 */
router.post('/log', validateAnalyticsLog, handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const analyticsService = new WritingAnalyticsService(supabase);

    const {
      noteId,
      noteSectionId,
      originalGenerated,
      userEditedVersion,
      editType,
      confidenceScore,
      userSatisfactionScore,
      feedbackNotes,
      tokensUsed,
      generationTimeMs,
      styleMatchScore
    } = req.body;

    // Calculate style match score if not provided and user edited the content
    let calculatedStyleMatchScore = styleMatchScore;
    if (!styleMatchScore && userEditedVersion && req.user.writingStyle) {
      calculatedStyleMatchScore = analyticsService.calculateStyleMatchScore(
        originalGenerated,
        req.user.writingStyle,
        userEditedVersion
      );
    }

    const result = await analyticsService.logAnalytics({
      userId,
      noteId,
      noteSectionId,
      originalGenerated,
      userEditedVersion,
      editType,
      confidenceScore: confidenceScore || 0.50,
      userSatisfactionScore,
      feedbackNotes,
      tokensUsed,
      generationTimeMs,
      styleMatchScore: calculatedStyleMatchScore
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Analytics logged successfully',
      analyticsId: result.analyticsId
    });

  } catch (error) {
    console.error('Analytics logging error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log analytics'
    });
  }
});

/**
 * GET /api/writing-analytics/summary
 * Get user's writing analytics summary
 */
router.get('/summary', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const analyticsService = new WritingAnalyticsService(supabase);

    const result = await analyticsService.getAnalyticsSummary(userId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      summary: result.summary
    });

  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics summary'
    });
  }
});

/**
 * GET /api/writing-analytics/history
 * Get user's writing analytics history
 */
router.get('/history', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const analyticsService = new WritingAnalyticsService(supabase);

    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const result = await analyticsService.getAnalyticsHistory(userId, limit, offset);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      analytics: result.analytics,
      pagination: {
        limit,
        offset,
        total: result.analytics.length
      }
    });

  } catch (error) {
    console.error('Analytics history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics history'
    });
  }
});

/**
 * GET /api/writing-analytics/style-evolution
 * Get user's style evolution history
 */
router.get('/style-evolution', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const analyticsService = new WritingAnalyticsService(supabase);

    const limit = parseInt(req.query.limit) || 20;

    const result = await analyticsService.getStyleEvolutionHistory(userId, limit);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      evolution: result.evolution
    });

  } catch (error) {
    console.error('Style evolution error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get style evolution history'
    });
  }
});

/**
 * POST /api/writing-analytics/evolve-style
 * Evolve user's writing style based on analytics
 */
router.post('/evolve-style', validateStyleEvolution, handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const analyticsService = new WritingAnalyticsService(supabase);

    const {
      newStyle,
      triggerReason,
      notesAnalyzed,
      improvementMetrics
    } = req.body;

    const result = await analyticsService.evolveWritingStyle({
      userId,
      newStyle,
      triggerReason,
      notesAnalyzed: notesAnalyzed || 0,
      improvementMetrics
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Writing style evolved successfully'
    });

  } catch (error) {
    console.error('Style evolution error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to evolve writing style'
    });
  }
});

/**
 * POST /api/writing-analytics/analyze-style
 * Analyze writing style quality and provide suggestions
 */
router.post('/analyze-style', [
  body('writingStyle').trim().isLength({ min: 10, max: 3000 }).withMessage('Writing style must be between 10 and 3000 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const analyticsService = new WritingAnalyticsService(supabase);

    const { writingStyle } = req.body;

    const analysis = analyticsService.analyzeWritingStyleQuality(writingStyle);

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Style analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze writing style'
    });
  }
});

/**
 * PUT /api/writing-analytics/update-confidence
 * Manually update user's writing style confidence
 */
router.put('/update-confidence', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const analyticsService = new WritingAnalyticsService(supabase);

    const result = await analyticsService.updateStyleConfidence(userId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Style confidence updated successfully'
    });

  } catch (error) {
    console.error('Confidence update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update style confidence'
    });
  }
});

module.exports = router;
