-- ISP Structured Data Migration
-- Execute this SQL in the Supabase SQL Editor

-- Add structured data columns to isp_tasks table
ALTER TABLE isp_tasks 
ADD COLUMN IF NOT EXISTS structured_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS form_type VARCHAR(50) DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS extraction_method VARCHAR(20) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS extraction_confidence DECIMAL(5,2) DEFAULT 100.00;

-- Create index for structured data queries
CREATE INDEX IF NOT EXISTS idx_isp_tasks_structured_data 
ON isp_tasks USING GIN (structured_data);

-- Create index for form type
CREATE INDEX IF NOT EXISTS idx_isp_tasks_form_type 
ON isp_tasks (form_type);

-- Create index for extraction method
CREATE INDEX IF NOT EXISTS idx_isp_tasks_extraction_method 
ON isp_tasks (extraction_method);

-- Add comments for documentation
COMMENT ON COLUMN isp_tasks.structured_data IS 'JSON object containing structured form data (goal, activeTreatment, individualResponse, scoresComments, etc.)';
COMMENT ON COLUMN isp_tasks.form_type IS 'Type of form this task was extracted from (basic, isp_form, treatment_plan, etc.)';
COMMENT ON COLUMN isp_tasks.extraction_method IS 'Method used to extract this task (manual, ocr, ai, import)';
COMMENT ON COLUMN isp_tasks.extraction_confidence IS 'Confidence score for OCR/AI extracted tasks (0-100)';

-- Update existing tasks with basic structured data
UPDATE isp_tasks 
SET 
  structured_data = jsonb_build_object(
    'goal', description,
    'activeTreatment', '',
    'individualResponse', '',
    'scoresComments', '',
    'type', 'goal'
  ),
  form_type = 'basic',
  extraction_method = 'manual',
  extraction_confidence = 100.00
WHERE structured_data = '{}' OR structured_data IS NULL;

-- Verify the migration
SELECT 
  id,
  description,
  structured_data,
  form_type,
  extraction_method,
  extraction_confidence
FROM isp_tasks 
LIMIT 5;