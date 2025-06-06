/**
 * OCR Service for SwiftNotes
 * Handles image processing and text extraction from ISP task screenshots
 */

const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class OCRService {
  constructor() {
    this.isInitialized = false;
    this.worker = null;
  }

  /**
   * Initialize Tesseract worker
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🔍 Initializing OCR service...');
      this.worker = await Tesseract.createWorker('eng');
      
      // Configure Tesseract for better text recognition
      await this.worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!?()[]{}"-\' \n\r\t',
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        preserve_interword_spaces: '1',
      });

      this.isInitialized = true;
      console.log('✅ OCR service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize OCR service:', error);
      throw new Error('OCR service initialization failed');
    }
  }

  /**
   * Preprocess image for better OCR results
   */
  async preprocessImage(inputBuffer) {
    try {
      console.log('🖼️ Preprocessing image for OCR...');
      
      const processedBuffer = await sharp(inputBuffer)
        .resize(null, 1200, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .grayscale()
        .normalize()
        .sharpen()
        .threshold(128)
        .png()
        .toBuffer();

      console.log('✅ Image preprocessing completed');
      return processedBuffer;
    } catch (error) {
      console.error('❌ Image preprocessing failed:', error);
      throw new Error('Image preprocessing failed');
    }
  }

  /**
   * Extract text from image using OCR
   */
  async extractText(imageBuffer, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🔍 Starting OCR text extraction...');
      
      // Preprocess image for better results
      const processedImage = await this.preprocessImage(imageBuffer);
      
      // Perform OCR
      const { data } = await this.worker.recognize(processedImage);
      
      console.log('✅ OCR text extraction completed');
      console.log(`📝 Extracted ${data.text.length} characters with ${data.confidence}% confidence`);
      
      return {
        text: data.text,
        confidence: data.confidence,
        words: data.words || [],
        lines: data.lines || [],
        paragraphs: data.paragraphs || []
      };
    } catch (error) {
      console.error('❌ OCR text extraction failed:', error);
      throw new Error('OCR text extraction failed');
    }
  }

  /**
   * Parse ISP tasks from extracted text
   */
  parseISPTasks(extractedText, confidence) {
    try {
      console.log('📋 Parsing ISP tasks from extracted text...');
      
      if (confidence < 60) {
        console.warn('⚠️ Low OCR confidence, results may be inaccurate');
      }

      const text = extractedText.trim();
      if (!text) {
        return {
          tasks: [],
          warnings: ['No text was extracted from the image']
        };
      }

      // Split text into potential task lines
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 5); // Filter out very short lines

      const tasks = [];
      const warnings = [];

      // Common ISP task patterns
      const taskPatterns = [
        /^(\d+\.?\s*)?(.+(?:will|shall|must|should|can).+)$/i,
        /^(\d+\.?\s*)?(.+(?:assist|help|support|encourage).+)$/i,
        /^(\d+\.?\s*)?(.+(?:complete|perform|demonstrate|show).+)$/i,
        /^(\d+\.?\s*)?(.+(?:maintain|continue|practice).+)$/i,
        /^(\d+\.?\s*)?(.+(?:improve|increase|decrease|reduce).+)$/i,
        /^(\d+\.?\s*)?(.+(?:participate|engage|attend).+)$/i,
        /^(\d+\.?\s*)?(.+(?:communicate|express|verbalize).+)$/i,
        /^(\d+\.?\s*)?(.+(?:follow|adhere|comply).+)$/i,
      ];

      for (const line of lines) {
        let isTask = false;
        let taskText = line;

        // Check against task patterns
        for (const pattern of taskPatterns) {
          const match = line.match(pattern);
          if (match) {
            taskText = match[2].trim();
            isTask = true;
            break;
          }
        }

        // Additional heuristics for task identification
        if (!isTask) {
          // Check for common task indicators
          const taskIndicators = [
            'individual will', 'client will', 'participant will',
            'goal:', 'objective:', 'outcome:',
            'task:', 'activity:', 'intervention:'
          ];

          const lowerLine = line.toLowerCase();
          for (const indicator of taskIndicators) {
            if (lowerLine.includes(indicator)) {
              isTask = true;
              // Clean up the task text
              taskText = line.replace(/^(goal|objective|outcome|task|activity|intervention):\s*/i, '').trim();
              break;
            }
          }
        }

        // If it looks like a task, add it
        if (isTask && taskText.length >= 10) {
          tasks.push({
            description: taskText,
            confidence: confidence,
            source: 'ocr'
          });
        }
      }

      // Add warnings based on results
      if (tasks.length === 0) {
        warnings.push('No ISP tasks were identified in the extracted text');
        warnings.push('Please review the extracted text and manually add tasks');
      } else if (confidence < 80) {
        warnings.push('OCR confidence is below 80%. Please review and edit the extracted tasks');
      }

      console.log(`✅ Parsed ${tasks.length} potential ISP tasks`);
      
      return {
        tasks,
        warnings,
        extractedText: text,
        confidence
      };
    } catch (error) {
      console.error('❌ ISP task parsing failed:', error);
      throw new Error('ISP task parsing failed');
    }
  }

  /**
   * Parse structured ISP form data from extracted text
   */
  parseStructuredISPForm(extractedText, confidence, words = [], lines = []) {
    try {
      console.log('📋 Parsing structured ISP form from extracted text...');

      if (confidence < 60) {
        console.warn('⚠️ Low OCR confidence, results may be inaccurate');
      }

      const text = extractedText.trim();
      if (!text) {
        return {
          tasks: [],
          warnings: ['No text was extracted from the image']
        };
      }

      // Split text into sections and analyze structure
      const sections = this.identifyFormSections(text, lines);
      const structuredTasks = this.extractStructuredTasks(sections, confidence);

      const warnings = [];

      // Add warnings based on results
      if (structuredTasks.length === 0) {
        warnings.push('No ISP tasks were identified in the extracted text');
        warnings.push('Please review the extracted text and manually add tasks');
      } else if (confidence < 80) {
        warnings.push('OCR confidence is below 80%. Please review and edit the extracted tasks');
      }

      console.log(`✅ Parsed ${structuredTasks.length} structured ISP tasks`);

      return {
        tasks: structuredTasks,
        warnings,
        extractedText: text,
        confidence,
        formSections: sections
      };
    } catch (error) {
      console.error('❌ Structured ISP form parsing failed:', error);
      throw new Error('Structured ISP form parsing failed');
    }
  }

  /**
   * Identify form sections from extracted text
   */
  identifyFormSections(text, lines = []) {
    const sections = [];
    const textLines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    let currentSection = null;
    let currentContent = [];

    // Form field indicators
    const fieldIndicators = {
      'goal': /^(goal|objective):\s*/i,
      'active_treatment': /^(active\s+treatment|treatment|intervention):\s*/i,
      'individual_response': /^(individual\s+response|response|client\s+response):\s*/i,
      'scores_comments': /^(scores?\/comments?|comments?|scores?|evaluation):\s*/i,
      'description': /^(description|task\s+description|details?):\s*/i
    };

    for (let i = 0; i < textLines.length; i++) {
      const line = textLines[i];
      let foundField = false;

      // Check if this line starts a new form field
      for (const [fieldType, pattern] of Object.entries(fieldIndicators)) {
        if (pattern.test(line)) {
          // Save previous section if exists
          if (currentSection && currentContent.length > 0) {
            sections.push({
              ...currentSection,
              content: currentContent.join(' ').trim()
            });
          }

          // Start new section
          currentSection = {
            type: fieldType,
            startLine: i,
            label: line.match(pattern)[0].trim()
          };
          currentContent = [line.replace(pattern, '').trim()];
          foundField = true;
          break;
        }
      }

      // If no field indicator found, add to current content
      if (!foundField && currentSection) {
        currentContent.push(line);
      } else if (!foundField && !currentSection) {
        // This might be a goal or description without explicit label
        if (this.looksLikeTaskDescription(line)) {
          currentSection = {
            type: 'goal',
            startLine: i,
            label: 'Goal:'
          };
          currentContent = [line];
        }
      }
    }

    // Add the last section
    if (currentSection && currentContent.length > 0) {
      sections.push({
        ...currentSection,
        content: currentContent.join(' ').trim()
      });
    }

    return sections;
  }

  /**
   * Extract structured tasks from identified form sections
   */
  extractStructuredTasks(sections, confidence) {
    const tasks = [];
    let currentTask = {};

    for (const section of sections) {
      const content = section.content.trim();
      if (!content || content.length < 5) continue;

      switch (section.type) {
        case 'goal':
          // If we have a previous task, save it
          if (Object.keys(currentTask).length > 0) {
            tasks.push(this.finalizeTask(currentTask, confidence));
          }
          // Start new task
          currentTask = {
            goal: content,
            type: 'goal'
          };
          break;

        case 'active_treatment':
          if (currentTask.goal) {
            currentTask.activeTreatment = content;
          }
          break;

        case 'individual_response':
          if (currentTask.goal) {
            currentTask.individualResponse = content;
          }
          break;

        case 'scores_comments':
          if (currentTask.goal) {
            currentTask.scoresComments = content;
          }
          break;

        case 'description':
          if (!currentTask.goal) {
            currentTask.goal = content;
            currentTask.type = 'goal';
          }
          break;
      }
    }

    // Add the last task
    if (Object.keys(currentTask).length > 0) {
      tasks.push(this.finalizeTask(currentTask, confidence));
    }

    return tasks;
  }

  /**
   * Finalize a task object with proper structure
   */
  finalizeTask(taskData, confidence) {
    const description = taskData.goal || 'Extracted task';

    return {
      description: description,
      confidence: confidence,
      source: 'ocr',
      structuredData: {
        goal: taskData.goal || '',
        activeTreatment: taskData.activeTreatment || '',
        individualResponse: taskData.individualResponse || '',
        scoresComments: taskData.scoresComments || '',
        type: taskData.type || 'goal'
      }
    };
  }

  /**
   * Check if a line looks like a task description
   */
  looksLikeTaskDescription(line) {
    const taskIndicators = [
      'will', 'shall', 'should', 'must',
      'complete', 'perform', 'demonstrate',
      'achieve', 'maintain', 'improve',
      'increase', 'decrease', 'develop'
    ];

    const lowerLine = line.toLowerCase();
    return taskIndicators.some(indicator => lowerLine.includes(indicator)) && line.length >= 20;
  }

  /**
   * Process ISP screenshot and extract tasks
   */
  async processISPScreenshot(imageBuffer, options = {}) {
    try {
      console.log('🚀 Processing ISP screenshot...');

      // Extract text using OCR
      const ocrResult = await this.extractText(imageBuffer, options);

      // Use structured parsing for better form recognition
      const parseResult = this.parseStructuredISPForm(
        ocrResult.text,
        ocrResult.confidence,
        ocrResult.words,
        ocrResult.lines
      );

      return {
        success: true,
        tasks: parseResult.tasks,
        warnings: parseResult.warnings,
        extractedText: parseResult.extractedText,
        confidence: ocrResult.confidence,
        formSections: parseResult.formSections,
        metadata: {
          processingTime: Date.now(),
          ocrEngine: 'tesseract',
          imageProcessed: true,
          structuredParsing: true
        }
      };
    } catch (error) {
      console.error('❌ ISP screenshot processing failed:', error);
      return {
        success: false,
        error: error.message,
        tasks: [],
        warnings: ['Failed to process the uploaded image'],
        extractedText: '',
        confidence: 0
      };
    }
  }

  /**
   * Validate uploaded image
   */
  async validateImage(imageBuffer) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      const validations = {
        isValid: true,
        warnings: [],
        errors: []
      };

      // Check file size (max 10MB)
      if (imageBuffer.length > 10 * 1024 * 1024) {
        validations.errors.push('Image file size exceeds 10MB limit');
        validations.isValid = false;
      }

      // Check dimensions
      if (metadata.width && metadata.height) {
        if (metadata.width < 200 || metadata.height < 200) {
          validations.warnings.push('Image resolution is quite low, OCR accuracy may be reduced');
        }
        
        if (metadata.width > 4000 || metadata.height > 4000) {
          validations.warnings.push('Image resolution is very high, processing may take longer');
        }
      }

      // Check format
      const supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'tiff'];
      if (metadata.format && !supportedFormats.includes(metadata.format.toLowerCase())) {
        validations.errors.push(`Unsupported image format: ${metadata.format}. Supported formats: ${supportedFormats.join(', ')}`);
        validations.isValid = false;
      }

      return validations;
    } catch (error) {
      return {
        isValid: false,
        errors: ['Invalid image file'],
        warnings: []
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      if (this.worker) {
        await this.worker.terminate();
        this.worker = null;
        this.isInitialized = false;
        console.log('✅ OCR service cleaned up');
      }
    } catch (error) {
      console.error('❌ OCR cleanup failed:', error);
    }
  }
}

// Create singleton instance
const ocrService = new OCRService();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await ocrService.cleanup();
});

process.on('SIGINT', async () => {
  await ocrService.cleanup();
});

module.exports = ocrService;
