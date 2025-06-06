/**
 * OCR Routes for SwiftNotes
 * Handles image upload and OCR processing for ISP task extraction
 */

const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const ocrService = require('../services/ocrService');
const router = express.Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/tiff'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and TIFF images are allowed.'), false);
    }
  }
});

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

/**
 * POST /api/ocr/process-isp-screenshot
 * Process ISP screenshot and extract tasks using OCR
 */
router.post('/process-isp-screenshot', upload.single('image'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded'
      });
    }

    console.log(`📤 Processing ISP screenshot upload for user ${userId}`);
    console.log(`📁 File info: ${req.file.originalname}, ${req.file.size} bytes, ${req.file.mimetype}`);

    // Validate image
    const validation = await ocrService.validateImage(req.file.buffer);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image file',
        details: validation.errors
      });
    }

    // Process the image with OCR
    const ocrResult = await ocrService.processISPScreenshot(req.file.buffer);
    
    if (!ocrResult.success) {
      return res.status(500).json({
        success: false,
        error: ocrResult.error || 'OCR processing failed',
        extractedText: ocrResult.extractedText,
        warnings: ocrResult.warnings
      });
    }

    // Log OCR usage for analytics
    try {
      const supabase = req.app.locals.supabase;

      await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          transaction_type: 'usage',
          amount: -1, // OCR costs 1 credit
          description: 'OCR processing for ISP screenshot',
          reference_id: `ocr_${Date.now()}`
        });

      // Deduct credit from user
      await supabase
        .from('user_profiles')
        .update({
          credits: supabase.raw('credits - 1'),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } catch (creditError) {
      console.warn('Failed to log OCR credit usage:', creditError);
      // Don't fail the request for credit logging issues
    }

    res.json({
      success: true,
      message: 'ISP screenshot processed successfully',
      data: {
        tasks: ocrResult.tasks,
        extractedText: ocrResult.extractedText,
        confidence: ocrResult.confidence,
        warnings: ocrResult.warnings.concat(validation.warnings || []),
        metadata: ocrResult.metadata
      }
    });

  } catch (error) {
    console.error('OCR processing error:', error);
    
    // Handle specific multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File size too large. Maximum size is 10MB.'
        });
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          error: 'Too many files. Please upload only one image.'
        });
      }
    }

    res.status(500).json({
      success: false,
      error: 'OCR processing failed. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/ocr/extract-text
 * Extract raw text from image (for debugging/testing)
 */
router.post('/extract-text', upload.single('image'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded'
      });
    }

    console.log(`🔍 Extracting text from image for user ${userId}`);

    // Validate image
    const validation = await ocrService.validateImage(req.file.buffer);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image file',
        details: validation.errors
      });
    }

    // Extract text using OCR
    const ocrResult = await ocrService.extractText(req.file.buffer);
    
    res.json({
      success: true,
      message: 'Text extraction completed',
      data: {
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        warnings: validation.warnings || [],
        metadata: {
          processingTime: Date.now(),
          characterCount: ocrResult.text.length,
          wordCount: ocrResult.words ? ocrResult.words.length : 0
        }
      }
    });

  } catch (error) {
    console.error('Text extraction error:', error);
    res.status(500).json({
      success: false,
      error: 'Text extraction failed. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/ocr/status
 * Get OCR service status
 */
router.get('/status', async (req, res) => {
  try {
    // Check if OCR service is available
    const isAvailable = process.env.ENABLE_OCR !== 'false';
    
    res.json({
      success: true,
      status: {
        available: isAvailable,
        engine: 'tesseract.js',
        supportedFormats: ['JPEG', 'PNG', 'WebP', 'TIFF'],
        maxFileSize: '10MB',
        features: [
          'ISP task extraction',
          'Text extraction',
          'Image preprocessing',
          'Confidence scoring'
        ]
      }
    });
  } catch (error) {
    console.error('OCR status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check OCR status'
    });
  }
});

/**
 * POST /api/ocr/validate-tasks
 * Validate and clean up OCR-extracted tasks
 */
router.post('/validate-tasks', [
  body('tasks').isArray().withMessage('Tasks must be an array'),
  body('tasks.*.description').trim().isLength({ min: 5, max: 500 }).withMessage('Task description must be between 5 and 500 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { tasks } = req.body;
    const userId = req.user.id;

    console.log(`✅ Validating ${tasks.length} OCR-extracted tasks for user ${userId}`);

    const validatedTasks = [];
    const warnings = [];

    for (const task of tasks) {
      const description = task.description.trim();
      
      // Basic validation
      if (description.length < 5) {
        warnings.push(`Task too short: "${description}"`);
        continue;
      }

      if (description.length > 500) {
        warnings.push(`Task too long, truncated: "${description.substring(0, 50)}..."`);
        validatedTasks.push({
          description: description.substring(0, 500),
          confidence: task.confidence || 0,
          source: task.source || 'ocr',
          validated: true
        });
        continue;
      }

      // Clean up common OCR errors
      let cleanedDescription = description
        .replace(/[|]/g, 'I') // Common OCR error: | instead of I
        .replace(/[0]/g, 'O') // Common OCR error: 0 instead of O in words
        .replace(/\s+/g, ' ') // Multiple spaces to single space
        .replace(/([.!?])\s*([a-z])/g, '$1 $2') // Fix spacing after punctuation
        .trim();

      validatedTasks.push({
        description: cleanedDescription,
        confidence: task.confidence || 0,
        source: task.source || 'ocr',
        validated: true,
        originalDescription: description !== cleanedDescription ? description : undefined
      });
    }

    res.json({
      success: true,
      message: `Validated ${validatedTasks.length} tasks`,
      data: {
        tasks: validatedTasks,
        warnings,
        summary: {
          total: tasks.length,
          validated: validatedTasks.length,
          rejected: tasks.length - validatedTasks.length
        }
      }
    });

  } catch (error) {
    console.error('Task validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Task validation failed'
    });
  }
});

module.exports = router;
