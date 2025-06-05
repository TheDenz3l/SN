-- Fix Templates Foreign Key Constraint
-- Resolves the templates_created_by_fkey relationship issue

-- First, let's check if the foreign key constraint exists and fix it
-- Drop the existing foreign key constraint if it exists
ALTER TABLE templates DROP CONSTRAINT IF EXISTS templates_created_by_fkey;

-- Add the correct foreign key constraint
-- Note: In Supabase, auth.users is accessible, but we need to ensure the constraint is properly named
ALTER TABLE templates 
ADD CONSTRAINT templates_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Also fix organization_id foreign key if needed
ALTER TABLE templates DROP CONSTRAINT IF EXISTS templates_organization_id_fkey;
ALTER TABLE templates 
ADD CONSTRAINT templates_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Fix organization_members foreign key constraints
ALTER TABLE organization_members DROP CONSTRAINT IF EXISTS organization_members_organization_id_fkey;
ALTER TABLE organization_members 
ADD CONSTRAINT organization_members_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE organization_members DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey;
ALTER TABLE organization_members 
ADD CONSTRAINT organization_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix template_usage foreign key constraints
ALTER TABLE template_usage DROP CONSTRAINT IF EXISTS template_usage_template_id_fkey;
ALTER TABLE template_usage 
ADD CONSTRAINT template_usage_template_id_fkey 
FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE;

ALTER TABLE template_usage DROP CONSTRAINT IF EXISTS template_usage_user_id_fkey;
ALTER TABLE template_usage 
ADD CONSTRAINT template_usage_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE template_usage DROP CONSTRAINT IF EXISTS template_usage_organization_id_fkey;
ALTER TABLE template_usage 
ADD CONSTRAINT template_usage_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Fix user_analytics foreign key constraints
ALTER TABLE user_analytics DROP CONSTRAINT IF EXISTS user_analytics_user_id_fkey;
ALTER TABLE user_analytics 
ADD CONSTRAINT user_analytics_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_analytics DROP CONSTRAINT IF EXISTS user_analytics_organization_id_fkey;
ALTER TABLE user_analytics 
ADD CONSTRAINT user_analytics_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Fix organization_analytics foreign key constraints
ALTER TABLE organization_analytics DROP CONSTRAINT IF EXISTS organization_analytics_organization_id_fkey;
ALTER TABLE organization_analytics 
ADD CONSTRAINT organization_analytics_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Fix organization_invitations foreign key constraints
ALTER TABLE organization_invitations DROP CONSTRAINT IF EXISTS organization_invitations_organization_id_fkey;
ALTER TABLE organization_invitations 
ADD CONSTRAINT organization_invitations_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE organization_invitations DROP CONSTRAINT IF EXISTS organization_invitations_invited_by_fkey;
ALTER TABLE organization_invitations 
ADD CONSTRAINT organization_invitations_invited_by_fkey 
FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix shared_isp_tasks foreign key constraints
ALTER TABLE shared_isp_tasks DROP CONSTRAINT IF EXISTS shared_isp_tasks_organization_id_fkey;
ALTER TABLE shared_isp_tasks 
ADD CONSTRAINT shared_isp_tasks_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE shared_isp_tasks DROP CONSTRAINT IF EXISTS shared_isp_tasks_created_by_fkey;
ALTER TABLE shared_isp_tasks 
ADD CONSTRAINT shared_isp_tasks_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Refresh the schema cache by updating table comments
COMMENT ON TABLE templates IS 'Template library for note generation - Updated foreign keys';
COMMENT ON TABLE organization_members IS 'Organization membership management - Updated foreign keys';
COMMENT ON TABLE template_usage IS 'Template usage tracking - Updated foreign keys';
COMMENT ON TABLE user_analytics IS 'User analytics and metrics - Updated foreign keys';
COMMENT ON TABLE organization_analytics IS 'Organization analytics and metrics - Updated foreign keys';
COMMENT ON TABLE organization_invitations IS 'Organization invitation management - Updated foreign keys';
COMMENT ON TABLE shared_isp_tasks IS 'Shared ISP tasks for organizations - Updated foreign keys';
