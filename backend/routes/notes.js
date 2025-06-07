/**
 * Notes Routes for SwiftNotes
 * Handles CRUD operations for notes and note sections
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();

// Validation middleware
const validateNoteCreation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Note title must be between 1 and 200 characters'),
  body('content')
    .optional()
    .isObject()
    .withMessage('Content must be a valid object'),
  body('noteType')
    .optional()
    .isIn(['task', 'comment', 'general'])
    .withMessage('Note type must be task, comment, or general')
];

const validateNoteUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Note title must be between 1 and 200 characters'),
  body('content')
    .optional()
    .isObject()
    .withMessage('Content must be a valid object')
];

const validateNoteId = [
  param('id')
    .isUUID()
    .withMessage('Invalid note ID format')
];

const validateSectionId = [
  param('id')
    .isUUID()
    .withMessage('Invalid section ID format')
];

const validateSectionUpdate = [
  body('generated_content')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Generated content cannot be empty'),
  body('is_edited')
    .optional()
    .isBoolean()
    .withMessage('is_edited must be a boolean')
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters')
];

const validateBulkDelete = [
  body('noteIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('Note IDs array is required and must contain 1-100 items'),
  body('noteIds.*')
    .isUUID()
    .withMessage('Each note ID must be a valid UUID')
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
 * DEBUG ENDPOINT - GET /api/notes/debug/sections/:id
 * Raw database query to debug section retrieval issues
 * MUST BE BEFORE /:id route to avoid conflicts
 */
router.get('/debug/sections/:id', validateNoteId, handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const noteId = req.params.id;

    console.log('🔍 DEBUG: Querying sections for note:', noteId, 'user:', userId);

    // First, verify the note exists and belongs to user
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', userId)
      .single();

    if (noteError) {
      console.log('🔍 DEBUG: Note query error:', noteError);
      return res.status(404).json({
        success: false,
        error: 'Note not found',
        debug: { noteError }
      });
    }

    console.log('🔍 DEBUG: Note found:', note);

    // Query all sections for this note (without user filter to see if they exist)
    const { data: allSections, error: allSectionsError } = await supabase
      .from('note_sections')
      .select('*')
      .eq('note_id', noteId);

    console.log('🔍 DEBUG: All sections query result:', { allSections, allSectionsError });

    // Query sections with user filter (through note relationship)
    const { data: userSections, error: userSectionsError } = await supabase
      .from('note_sections')
      .select(`
        *,
        notes!inner (
          user_id
        )
      `)
      .eq('note_id', noteId)
      .eq('notes.user_id', userId);

    console.log('🔍 DEBUG: User sections query result:', { userSections, userSectionsError });

    // Count total sections in database
    const { count: totalSections, error: countError } = await supabase
      .from('note_sections')
      .select('*', { count: 'exact', head: true });

    console.log('🔍 DEBUG: Total sections in database:', totalSections, countError);

    res.json({
      success: true,
      debug: {
        noteId,
        userId,
        note,
        allSections: allSections || [],
        userSections: userSections || [],
        totalSectionsInDb: totalSections,
        errors: {
          noteError,
          allSectionsError,
          userSectionsError,
          countError
        }
      }
    });

  } catch (error) {
    console.error('🔍 DEBUG: Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Debug query failed',
      debug: { error: error.message }
    });
  }
});

/**
 * GET /api/notes
 * Get all notes for the authenticated user with advanced filtering, pagination and search
 */
router.get('/', validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const noteType = req.query.noteType || '';
    const sortBy = req.query.sortBy || 'updated_at';
    const sortOrder = req.query.sortOrder || 'desc';
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('notes')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Add search filter if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,content->>sections.ilike.%${search}%`);
    }

    // Add note type filter
    if (noteType) {
      query = query.eq('note_type', noteType);
    }

    // Add date range filters
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      // Add one day to endDate to include the entire end date
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      query = query.lt('created_at', endDateTime.toISOString());
    }

    // Add sorting
    const validSortFields = ['created_at', 'updated_at', 'title', 'note_type', 'tokens_used', 'cost'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'updated_at';
    const order = sortOrder === 'asc' ? { ascending: true } : { ascending: false };

    query = query.order(sortField, order);

    // Add pagination
    const { data: notes, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Notes fetch error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch notes'
      });
    }

    // Get note sections for each note to provide complete content
    const notesWithSections = await Promise.all(
      (notes || []).map(async (note) => {
        const { data: sections } = await supabase
          .from('note_sections')
          .select('*')
          .eq('note_id', note.id)
          .order('created_at', { ascending: true });

        return {
          ...note,
          sections: sections || []
        };
      })
    );

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      notes: notesWithSections,
      total: count || 0,
      page,
      totalPages,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        search,
        noteType,
        sortBy,
        sortOrder,
        startDate,
        endDate
      }
    });

  } catch (error) {
    console.error('Notes fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notes'
    });
  }
});

/**
 * DELETE /api/notes/bulk
 * Delete multiple notes
 */
router.delete('/bulk', validateBulkDelete, handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const { noteIds } = req.body;

    console.log(`Bulk delete request from user ${userId} for ${noteIds.length} notes:`, noteIds);

    // Verify all notes belong to the user
    const { data: userNotes, error: verifyError } = await supabase
      .from('notes')
      .select('id')
      .eq('user_id', userId)
      .in('id', noteIds);

    if (verifyError) {
      console.error('Notes verification error:', verifyError);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify note ownership',
        details: verifyError.message
      });
    }

    const validNoteIds = userNotes.map(note => note.id);
    const invalidNoteIds = noteIds.filter(id => !validNoteIds.includes(id));

    if (invalidNoteIds.length > 0) {
      console.warn(`User ${userId} attempted to delete notes they don't own:`, invalidNoteIds);
      return res.status(403).json({
        success: false,
        error: 'Some notes do not belong to the user',
        invalidNoteIds
      });
    }

    console.log(`Verified ${validNoteIds.length} notes for deletion`);

    // Delete note sections first (due to foreign key constraint)
    const { error: sectionsError } = await supabase
      .from('note_sections')
      .delete()
      .in('note_id', validNoteIds);

    if (sectionsError) {
      console.error('Bulk sections deletion error:', sectionsError);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete note sections',
        details: sectionsError.message
      });
    }

    console.log(`Successfully deleted sections for ${validNoteIds.length} notes`);

    // Delete notes
    const { error: notesError } = await supabase
      .from('notes')
      .delete()
      .in('id', validNoteIds);

    if (notesError) {
      console.error('Bulk notes deletion error:', notesError);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete notes',
        details: notesError.message
      });
    }

    console.log(`Successfully completed bulk deletion of ${validNoteIds.length} notes for user ${userId}`);

    res.json({
      success: true,
      message: `Successfully deleted ${validNoteIds.length} notes`,
      deletedCount: validNoteIds.length
    });

  } catch (error) {
    console.error('Bulk deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notes',
      details: error.message
    });
  }
});

/**
 * GET /api/notes/recent
 * Get recent notes for dashboard
 */
router.get('/recent', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;

    const { data: notes, error } = await supabase
      .from('notes')
      .select('id, title, note_type, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Recent notes fetch error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch recent notes'
      });
    }

    res.json({
      success: true,
      notes: notes || []
    });

  } catch (error) {
    console.error('Recent notes fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent notes'
    });
  }
});

/**
 * GET /api/notes/export
 * Export notes in various formats
 */
router.get('/export', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const { format = 'json', noteIds } = req.query;

    let query = supabase
      .from('notes')
      .select(`
        *,
        note_sections (*)
      `)
      .eq('user_id', userId);

    // Filter by specific note IDs if provided
    if (noteIds) {
      const ids = Array.isArray(noteIds) ? noteIds : noteIds.split(',');
      query = query.in('id', ids);
    }

    const { data: notes, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Notes export error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch notes for export'
      });
    }

    // Format the data based on requested format
    let exportData;
    let contentType;
    let filename;

    switch (format.toLowerCase()) {
      case 'csv':
        // Convert to CSV format
        const csvHeaders = ['Title', 'Type', 'Created', 'Updated', 'Tokens', 'Cost', 'Content'];
        const csvRows = notes.map(note => [
          `"${note.title.replace(/"/g, '""')}"`,
          note.note_type,
          note.created_at,
          note.updated_at,
          note.tokens_used || 0,
          note.cost || 0,
          `"${JSON.stringify(note.content).replace(/"/g, '""')}"`
        ]);

        exportData = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
        contentType = 'text/csv';
        filename = `notes-export-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'txt':
        // Convert to plain text format
        exportData = notes.map(note => {
          let text = `Title: ${note.title}\n`;
          text += `Type: ${note.note_type}\n`;
          text += `Created: ${note.created_at}\n`;
          text += `Updated: ${note.updated_at}\n`;
          text += `Tokens: ${note.tokens_used || 0}\n`;
          text += `Cost: $${note.cost || 0}\n\n`;

          if (note.note_sections && note.note_sections.length > 0) {
            text += 'Content:\n';
            note.note_sections.forEach((section, index) => {
              text += `Section ${index + 1}:\n${section.generated_content}\n\n`;
            });
          } else if (note.content) {
            text += `Content:\n${JSON.stringify(note.content, null, 2)}\n\n`;
          }

          text += '---\n\n';
          return text;
        }).join('');

        contentType = 'text/plain';
        filename = `notes-export-${new Date().toISOString().split('T')[0]}.txt`;
        break;

      default: // json
        exportData = JSON.stringify({
          exportDate: new Date().toISOString(),
          totalNotes: notes.length,
          notes: notes
        }, null, 2);
        contentType = 'application/json';
        filename = `notes-export-${new Date().toISOString().split('T')[0]}.json`;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export notes'
    });
  }
});

/**
 * GET /api/notes/:id
 * Get a specific note by ID with its sections
 */
router.get('/:id', validateNoteId, handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const noteId = req.params.id;

    // Get note
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', userId)
      .single();

    if (noteError) {
      if (noteError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Note not found'
        });
      }
      console.error('Note fetch error:', noteError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch note'
      });
    }

    // Get note sections first (without JOIN to avoid filtering null isp_task_id)
    const { data: sections, error: sectionsError } = await supabase
      .from('note_sections')
      .select('*')
      .eq('note_id', noteId)
      .order('created_at', { ascending: true });

    // If sections exist and have isp_task_ids, fetch the related isp_tasks separately
    if (sections && sections.length > 0) {
      const sectionsWithTasks = sections.filter(s => s.isp_task_id);
      if (sectionsWithTasks.length > 0) {
        const taskIds = sectionsWithTasks.map(s => s.isp_task_id);
        const { data: tasks } = await supabase
          .from('isp_tasks')
          .select('id, description')
          .in('id', taskIds);

        // Attach tasks to sections
        if (tasks) {
          sections.forEach(section => {
            if (section.isp_task_id) {
              section.isp_tasks = tasks.find(t => t.id === section.isp_task_id) || null;
            } else {
              section.isp_tasks = null;
            }
          });
        }
      } else {
        // No sections have isp_task_ids, set all to null
        sections.forEach(section => {
          section.isp_tasks = null;
        });
      }
    }

    if (sectionsError) {
      console.error('Note sections fetch error:', sectionsError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch note sections'
      });
    }

    res.json({
      success: true,
      note: {
        ...note,
        sections: sections || []
      }
    });

  } catch (error) {
    console.error('Note fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch note'
    });
  }
});

/**
 * POST /api/notes
 * Create a new note
 */
router.post('/', validateNoteCreation, handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const { title, content, noteType = 'general' } = req.body;

    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        title,
        content: content || {},
        note_type: noteType,
        tokens_used: 0,
        cost: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Note creation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create note'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      note
    });

  } catch (error) {
    console.error('Note creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create note'
    });
  }
});

/**
 * PUT /api/notes/:id
 * Update an existing note
 */
router.put('/:id', validateNoteId, validateNoteUpdate, handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const noteId = req.params.id;
    const { title, content } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;

    const { data: note, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', noteId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Note not found'
        });
      }
      console.error('Note update error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update note'
      });
    }

    res.json({
      success: true,
      message: 'Note updated successfully',
      note
    });

  } catch (error) {
    console.error('Note update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update note'
    });
  }
});

/**
 * DELETE /api/notes/:id
 * Delete a note and its sections
 */
router.delete('/:id', validateNoteId, handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const noteId = req.params.id;

    // Delete note sections first (due to foreign key constraint)
    const { error: sectionsError } = await supabase
      .from('note_sections')
      .delete()
      .eq('note_id', noteId);

    if (sectionsError) {
      console.error('Note sections deletion error:', sectionsError);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete note sections'
      });
    }

    // Delete the note
    const { error: noteError } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', userId);

    if (noteError) {
      console.error('Note deletion error:', noteError);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete note'
      });
    }

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });

  } catch (error) {
    console.error('Note deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete note'
    });
  }
});

/**
 * GET /api/notes/:id/sections
 * Get all sections for a specific note
 */
router.get('/:id/sections', validateNoteId, handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const noteId = req.params.id;

    // Verify note belongs to user
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('id')
      .eq('id', noteId)
      .eq('user_id', userId)
      .single();

    if (noteError) {
      if (noteError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Note not found'
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Failed to verify note ownership'
      });
    }

    // Get sections first (without JOIN to avoid filtering null isp_task_id)
    const { data: sections, error: sectionsError } = await supabase
      .from('note_sections')
      .select('*')
      .eq('note_id', noteId)
      .order('created_at', { ascending: true });

    // If sections exist and have isp_task_ids, fetch the related isp_tasks separately
    if (sections && sections.length > 0) {
      const sectionsWithTasks = sections.filter(s => s.isp_task_id);
      if (sectionsWithTasks.length > 0) {
        const taskIds = sectionsWithTasks.map(s => s.isp_task_id);
        const { data: tasks } = await supabase
          .from('isp_tasks')
          .select('id, description')
          .in('id', taskIds);

        // Attach tasks to sections
        if (tasks) {
          sections.forEach(section => {
            if (section.isp_task_id) {
              section.isp_tasks = tasks.find(t => t.id === section.isp_task_id) || null;
            } else {
              section.isp_tasks = null;
            }
          });
        }
      } else {
        // No sections have isp_task_ids, set all to null
        sections.forEach(section => {
          section.isp_tasks = null;
        });
      }
    }

    if (sectionsError) {
      console.error('Note sections fetch error:', sectionsError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch note sections'
      });
    }

    res.json({
      success: true,
      sections: sections || []
    });

  } catch (error) {
    console.error('Note sections fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch note sections'
    });
  }
});

/**
 * GET /api/notes/recent
 * Get recent notes for dashboard
 */
router.get('/recent', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;

    const { data: notes, error } = await supabase
      .from('notes')
      .select('id, title, note_type, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Recent notes fetch error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch recent notes'
      });
    }

    res.json({
      success: true,
      notes: notes || []
    });

  } catch (error) {
    console.error('Recent notes fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent notes'
    });
  }
});

/**
 * PUT /api/notes/sections/:id
 * Update a note section content
 */
router.put('/sections/:id', validateSectionId, validateSectionUpdate, handleValidationErrors, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.id;
    const sectionId = req.params.id;
    const { generated_content, is_edited } = req.body;

    // First verify the section belongs to a note owned by the user
    const { data: section, error: sectionError } = await supabase
      .from('note_sections')
      .select(`
        id,
        note_id,
        notes!inner (
          user_id
        )
      `)
      .eq('id', sectionId)
      .eq('notes.user_id', userId)
      .single();

    if (sectionError) {
      if (sectionError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Section not found or access denied'
        });
      }
      console.error('Section verification error:', sectionError);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify section ownership'
      });
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (generated_content !== undefined) updateData.generated_content = generated_content;
    if (is_edited !== undefined) updateData.is_edited = is_edited;

    // Update the section
    const { data: updatedSection, error: updateError } = await supabase
      .from('note_sections')
      .update(updateData)
      .eq('id', sectionId)
      .select()
      .single();

    if (updateError) {
      console.error('Section update error:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update section'
      });
    }

    res.json({
      success: true,
      message: 'Section updated successfully',
      section: updatedSection
    });

  } catch (error) {
    console.error('Section update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update section'
    });
  }
});

module.exports = router;
