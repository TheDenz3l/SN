-- ISP Structured Data Migration
-- Adds support for structured form data in ISP tasks

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

-- Create function to validate structured data
CREATE OR REPLACE FUNCTION validate_isp_structured_data(data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the JSON structure is valid for ISP tasks
  IF data IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Validate that if structured data exists, it has expected fields
  IF jsonb_typeof(data) != 'object' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for valid field types if they exist
  IF data ? 'goal' AND jsonb_typeof(data->'goal') != 'string' THEN
    RETURN FALSE;
  END IF;
  
  IF data ? 'activeTreatment' AND jsonb_typeof(data->'activeTreatment') != 'string' THEN
    RETURN FALSE;
  END IF;
  
  IF data ? 'individualResponse' AND jsonb_typeof(data->'individualResponse') != 'string' THEN
    RETURN FALSE;
  END IF;
  
  IF data ? 'scoresComments' AND jsonb_typeof(data->'scoresComments') != 'string' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add constraint to validate structured data
ALTER TABLE isp_tasks 
ADD CONSTRAINT check_structured_data_valid 
CHECK (validate_isp_structured_data(structured_data));

-- Add constraint for form_type values
ALTER TABLE isp_tasks 
ADD CONSTRAINT check_form_type_valid 
CHECK (form_type IN ('basic', 'isp_form', 'treatment_plan', 'goal_tracking', 'assessment', 'other'));

-- Add constraint for extraction_method values
ALTER TABLE isp_tasks 
ADD CONSTRAINT check_extraction_method_valid 
CHECK (extraction_method IN ('manual', 'ocr', 'ai', 'import', 'template'));

-- Add constraint for extraction_confidence range
ALTER TABLE isp_tasks 
ADD CONSTRAINT check_extraction_confidence_range 
CHECK (extraction_confidence >= 0 AND extraction_confidence <= 100);

-- Create function to extract searchable text from structured data
CREATE OR REPLACE FUNCTION extract_searchable_text_from_structured_data(data JSONB)
RETURNS TEXT AS $$
BEGIN
  IF data IS NULL OR jsonb_typeof(data) != 'object' THEN
    RETURN '';
  END IF;
  
  RETURN COALESCE(data->>'goal', '') || ' ' ||
         COALESCE(data->>'activeTreatment', '') || ' ' ||
         COALESCE(data->>'individualResponse', '') || ' ' ||
         COALESCE(data->>'scoresComments', '');
END;
$$ LANGUAGE plpgsql;

-- Create view for enhanced ISP task search
CREATE OR REPLACE VIEW isp_tasks_searchable AS
SELECT 
  id,
  user_id,
  description,
  structured_data,
  form_type,
  extraction_method,
  extraction_confidence,
  order_index,
  created_at,
  updated_at,
  (description || ' ' || extract_searchable_text_from_structured_data(structured_data)) AS searchable_text
FROM isp_tasks;

-- Create function to migrate existing tasks to structured format
CREATE OR REPLACE FUNCTION migrate_existing_tasks_to_structured()
RETURNS INTEGER AS $$
DECLARE
  task_record RECORD;
  updated_count INTEGER := 0;
BEGIN
  -- Update existing tasks that don't have structured data
  FOR task_record IN 
    SELECT id, description 
    FROM isp_tasks 
    WHERE structured_data = '{}' OR structured_data IS NULL
  LOOP
    UPDATE isp_tasks 
    SET 
      structured_data = jsonb_build_object(
        'goal', task_record.description,
        'type', 'goal'
      ),
      form_type = 'basic',
      extraction_method = 'manual',
      extraction_confidence = 100.00
    WHERE id = task_record.id;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Run the migration for existing tasks
SELECT migrate_existing_tasks_to_structured() AS migrated_tasks_count;

-- Create trigger to automatically update searchable text when structured data changes
CREATE OR REPLACE FUNCTION update_isp_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS trigger_update_isp_task_updated_at ON isp_tasks;
CREATE TRIGGER trigger_update_isp_task_updated_at
  BEFORE UPDATE ON isp_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_isp_task_updated_at();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON isp_tasks TO authenticated;
GRANT SELECT ON isp_tasks_searchable TO authenticated;
GRANT EXECUTE ON FUNCTION validate_isp_structured_data(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION extract_searchable_text_from_structured_data(JSONB) TO authenticated;

-- Create helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_isp_tasks_user_form_type 
ON isp_tasks (user_id, form_type);

CREATE INDEX IF NOT EXISTS idx_isp_tasks_extraction_confidence 
ON isp_tasks (extraction_confidence) 
WHERE extraction_method IN ('ocr', 'ai');

-- Add helpful comments
COMMENT ON VIEW isp_tasks_searchable IS 'Enhanced view of ISP tasks with searchable text from both description and structured data';
COMMENT ON FUNCTION migrate_existing_tasks_to_structured() IS 'One-time migration function to convert existing tasks to structured format';
COMMENT ON FUNCTION extract_searchable_text_from_structured_data(JSONB) IS 'Extracts searchable text from structured data fields';
