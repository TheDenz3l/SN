/**
 * ISP Tasks Routes for SwiftNotes
 * Handles CRUD operations for Individualized Service Plan tasks
 */

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();

// Validation middleware
const validateTaskCreation = [
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Task description must be between 1 and 200 characters'),
  body('orderIndex')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order index must be a non-negative integer')
];

const validateTaskUpdate = [
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Task description must be between 1 and 200 characters'),
  body('orderIndex')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order index must be a non-negative integer')
];

const validateTaskId = [
  param('id')
    .isUUID()
    .withMessage('Invalid task ID format')
];

const validateBulkUpdate = [
  body('tasks')
    .isArray({ min: 1 })
    .withMessage('Tasks array is required'),
  body('tasks.*.id')
    .isUUID()
    .withMessage('Each task must have a valid ID'),
  body('tasks.*.description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Task description must be between 1 and 200 characters'),
  body('tasks.*.orderIndex')
    .isInt({ min: 0 })
    .withMessage('Order index must be a non-negative integer')
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
 * GET /api/isp-tasks
 * Get all ISP tasks for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;

    const { data: tasks, error } = await supabase
      .from('isp_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('ISP tasks fetch error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch ISP tasks'
      });
    }

    res.json({
      success: true,
      tasks: tasks || []
    });

  } catch (error) {
    console.error('ISP tasks fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ISP tasks'
    });
  }
});

/**
 * GET /api/isp-tasks/:id
 * Get a specific ISP task by ID
 */
router.get('/:id', validateTaskId, handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const taskId = req.params.id;

    const { data: task, error } = await supabase
      .from('isp_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'ISP task not found'
        });
      }
      console.error('ISP task fetch error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch ISP task'
      });
    }

    res.json({
      success: true,
      task
    });

  } catch (error) {
    console.error('ISP task fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ISP task'
    });
  }
});

/**
 * POST /api/isp-tasks
 * Create a new ISP task
 */
router.post('/', validateTaskCreation, handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const {
      description,
      orderIndex,
      structuredData,
      formType = 'basic',
      extractionMethod = 'manual',
      extractionConfidence = 100.00
    } = req.body;

    // If no order index provided, get the next available index
    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined) {
      const { data: existingTasks } = await supabase
        .from('isp_tasks')
        .select('order_index')
        .eq('user_id', userId)
        .order('order_index', { ascending: false })
        .limit(1);

      finalOrderIndex = existingTasks && existingTasks.length > 0
        ? existingTasks[0].order_index + 1
        : 0;
    }

    // Prepare task data
    const taskData = {
      user_id: userId,
      description,
      order_index: finalOrderIndex,
      form_type: formType,
      extraction_method: extractionMethod,
      extraction_confidence: extractionConfidence
    };

    // Add structured data if provided
    if (structuredData && typeof structuredData === 'object') {
      taskData.structured_data = structuredData;
    } else {
      // Create basic structured data from description
      taskData.structured_data = {
        goal: description,
        type: 'goal'
      };
    }

    const { data: task, error } = await supabase
      .from('isp_tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) {
      console.error('ISP task creation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create ISP task'
      });
    }

    res.status(201).json({
      success: true,
      message: 'ISP task created successfully',
      task
    });

  } catch (error) {
    console.error('ISP task creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create ISP task'
    });
  }
});

/**
 * POST /api/isp-tasks/bulk-create
 * Create multiple ISP tasks from OCR extraction
 */
router.post('/bulk-create', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const { tasks, extractionMetadata = {} } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tasks array is required and must not be empty'
      });
    }

    // Validate each task
    for (const task of tasks) {
      if (!task.description || typeof task.description !== 'string' || task.description.trim().length < 5) {
        return res.status(400).json({
          success: false,
          error: 'Each task must have a description of at least 5 characters'
        });
      }
    }

    // Get the current highest order index
    const { data: existingTasks } = await supabase
      .from('isp_tasks')
      .select('order_index')
      .eq('user_id', userId)
      .order('order_index', { ascending: false })
      .limit(1);

    let nextOrderIndex = existingTasks && existingTasks.length > 0
      ? existingTasks[0].order_index + 1
      : 0;

    // Prepare tasks for insertion
    const tasksToInsert = tasks.map((task, index) => ({
      user_id: userId,
      description: task.description.trim(),
      order_index: nextOrderIndex + index,
      structured_data: task.structuredData || {
        goal: task.description.trim(),
        activeTreatment: task.structuredData?.activeTreatment || '',
        individualResponse: task.structuredData?.individualResponse || '',
        scoresComments: task.structuredData?.scoresComments || '',
        type: 'goal'
      },
      form_type: task.formType || extractionMetadata.formType || 'isp_form',
      extraction_method: task.extractionMethod || extractionMetadata.extractionMethod || 'ocr',
      extraction_confidence: task.confidence || extractionMetadata.confidence || 0
    }));

    // Insert all tasks
    const { data: insertedTasks, error } = await supabase
      .from('isp_tasks')
      .insert(tasksToInsert)
      .select();

    if (error) {
      console.error('Bulk ISP task creation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create ISP tasks'
      });
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${insertedTasks.length} ISP tasks`,
      tasks: insertedTasks,
      metadata: {
        totalCreated: insertedTasks.length,
        extractionMethod: extractionMetadata.extractionMethod || 'ocr',
        extractionConfidence: extractionMetadata.confidence || 0
      }
    });

  } catch (error) {
    console.error('Bulk ISP task creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create ISP tasks'
    });
  }
});

/**
 * PUT /api/isp-tasks/:id
 * Update an existing ISP task
 */
router.put('/:id', validateTaskId, validateTaskUpdate, handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const taskId = req.params.id;
    const { description, orderIndex } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (description !== undefined) updateData.description = description;
    if (orderIndex !== undefined) updateData.order_index = orderIndex;

    const { data: task, error } = await supabase
      .from('isp_tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'ISP task not found'
        });
      }
      console.error('ISP task update error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update ISP task'
      });
    }

    res.json({
      success: true,
      message: 'ISP task updated successfully',
      task
    });

  } catch (error) {
    console.error('ISP task update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update ISP task'
    });
  }
});

/**
 * DELETE /api/isp-tasks/:id
 * Delete an ISP task
 */
router.delete('/:id', validateTaskId, handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const taskId = req.params.id;

    const { error } = await supabase
      .from('isp_tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);

    if (error) {
      console.error('ISP task deletion error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete ISP task'
      });
    }

    res.json({
      success: true,
      message: 'ISP task deleted successfully'
    });

  } catch (error) {
    console.error('ISP task deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete ISP task'
    });
  }
});

/**
 * PUT /api/isp-tasks/bulk-update
 * Update multiple ISP tasks (useful for reordering)
 */
router.put('/bulk-update', validateBulkUpdate, handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const { tasks } = req.body;

    // Verify all tasks belong to the user
    const taskIds = tasks.map(task => task.id);
    const { data: existingTasks, error: verifyError } = await supabase
      .from('isp_tasks')
      .select('id')
      .eq('user_id', userId)
      .in('id', taskIds);

    if (verifyError || existingTasks.length !== tasks.length) {
      return res.status(400).json({
        success: false,
        error: 'One or more tasks do not belong to the user'
      });
    }

    // Update each task
    const updatePromises = tasks.map(task => 
      supabase
        .from('isp_tasks')
        .update({
          description: task.description,
          order_index: task.orderIndex,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)
        .eq('user_id', userId)
        .select()
        .single()
    );

    const results = await Promise.all(updatePromises);
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Bulk update errors:', errors);
      return res.status(500).json({
        success: false,
        error: 'Failed to update some tasks'
      });
    }

    const updatedTasks = results.map(result => result.data);

    res.json({
      success: true,
      message: 'ISP tasks updated successfully',
      tasks: updatedTasks
    });

  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update ISP tasks'
    });
  }
});

/**
 * POST /api/isp-tasks/reorder
 * Reorder ISP tasks
 */
router.post('/reorder', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const { taskIds } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Task IDs array is required'
      });
    }

    // Verify all tasks belong to the user
    const { data: existingTasks, error: verifyError } = await supabase
      .from('isp_tasks')
      .select('id')
      .eq('user_id', userId)
      .in('id', taskIds);

    if (verifyError || existingTasks.length !== taskIds.length) {
      return res.status(400).json({
        success: false,
        error: 'One or more tasks do not belong to the user'
      });
    }

    // Update order indices
    const updatePromises = taskIds.map((taskId, index) => 
      supabase
        .from('isp_tasks')
        .update({
          order_index: index,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('user_id', userId)
    );

    await Promise.all(updatePromises);

    // Fetch updated tasks
    const { data: updatedTasks, error: fetchError } = await supabase
      .from('isp_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (fetchError) {
      console.error('Fetch updated tasks error:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch updated tasks'
      });
    }

    res.json({
      success: true,
      message: 'ISP tasks reordered successfully',
      tasks: updatedTasks
    });

  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reorder ISP tasks'
    });
  }
});

module.exports = router;
