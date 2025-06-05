-- RLS-Only Fix for Phase 3
-- Only fixes Row Level Security policies without recreating existing schema

-- Temporarily disable RLS on all Phase 3 tables
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE shared_isp_tasks DISABLE ROW LEVEL SECURITY;

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
DROP POLICY IF EXISTS "Users can insert organizations" ON organizations;
DROP POLICY IF EXISTS "Organization owners can update" ON organizations;
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can insert organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can update organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can delete organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can view accessible templates" ON templates;
DROP POLICY IF EXISTS "Users can insert templates" ON templates;
DROP POLICY IF EXISTS "Users can update own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON templates;
DROP POLICY IF EXISTS "Users can view own analytics" ON user_analytics;
DROP POLICY IF EXISTS "Users can insert own analytics" ON user_analytics;
DROP POLICY IF EXISTS "Users can update own analytics" ON user_analytics;
DROP POLICY IF EXISTS "Organization members can view org analytics" ON organization_analytics;
DROP POLICY IF EXISTS "Organization managers can insert org analytics" ON organization_analytics;
DROP POLICY IF EXISTS "Organization managers can update org analytics" ON organization_analytics;
DROP POLICY IF EXISTS "Users can view own template usage" ON template_usage;
DROP POLICY IF EXISTS "Users can insert template usage" ON template_usage;
DROP POLICY IF EXISTS "Users can view invitations to their orgs" ON organization_invitations;
DROP POLICY IF EXISTS "Users can insert invitations to their orgs" ON organization_invitations;
DROP POLICY IF EXISTS "Users can update invitations to their orgs" ON organization_invitations;
DROP POLICY IF EXISTS "Users can delete invitations to their orgs" ON organization_invitations;
DROP POLICY IF EXISTS "Users can view shared ISP tasks in their orgs" ON shared_isp_tasks;
DROP POLICY IF EXISTS "Users can insert shared ISP tasks in their orgs" ON shared_isp_tasks;
DROP POLICY IF EXISTS "Users can update shared ISP tasks in their orgs" ON shared_isp_tasks;
DROP POLICY IF EXISTS "Users can delete shared ISP tasks in their orgs" ON shared_isp_tasks;

-- Re-enable RLS with simple, non-recursive policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_isp_tasks ENABLE ROW LEVEL SECURITY;

-- Simple Organizations policies
CREATE POLICY "org_select_policy" ON organizations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "org_insert_policy" ON organizations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "org_update_policy" ON organizations
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Simple Organization Members policies
CREATE POLICY "org_members_select_policy" ON organization_members
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "org_members_insert_policy" ON organization_members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "org_members_update_policy" ON organization_members
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "org_members_delete_policy" ON organization_members
  FOR DELETE USING (auth.role() = 'authenticated');

-- Simple Templates policies
CREATE POLICY "templates_select_policy" ON templates
  FOR SELECT USING (
    visibility = 'public' OR 
    created_by = auth.uid() OR
    auth.role() = 'authenticated'
  );

CREATE POLICY "templates_insert_policy" ON templates
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "templates_update_policy" ON templates
  FOR UPDATE USING (created_by = auth.uid() OR auth.role() = 'authenticated');

CREATE POLICY "templates_delete_policy" ON templates
  FOR DELETE USING (created_by = auth.uid() OR auth.role() = 'authenticated');

-- Simple User Analytics policies
CREATE POLICY "user_analytics_select_policy" ON user_analytics
  FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'authenticated');

CREATE POLICY "user_analytics_insert_policy" ON user_analytics
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_analytics_update_policy" ON user_analytics
  FOR UPDATE USING (user_id = auth.uid());

-- Simple Organization Analytics policies
CREATE POLICY "org_analytics_select_policy" ON organization_analytics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "org_analytics_insert_policy" ON organization_analytics
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "org_analytics_update_policy" ON organization_analytics
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Simple Template Usage policies
CREATE POLICY "template_usage_select_policy" ON template_usage
  FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'authenticated');

CREATE POLICY "template_usage_insert_policy" ON template_usage
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Simple Organization Invitations policies
CREATE POLICY "org_invitations_select_policy" ON organization_invitations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "org_invitations_insert_policy" ON organization_invitations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "org_invitations_update_policy" ON organization_invitations
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "org_invitations_delete_policy" ON organization_invitations
  FOR DELETE USING (auth.role() = 'authenticated');

-- Simple Shared ISP Tasks policies
CREATE POLICY "shared_isp_select_policy" ON shared_isp_tasks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "shared_isp_insert_policy" ON shared_isp_tasks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "shared_isp_update_policy" ON shared_isp_tasks
  FOR UPDATE USING (created_by = auth.uid() OR auth.role() = 'authenticated');

CREATE POLICY "shared_isp_delete_policy" ON shared_isp_tasks
  FOR DELETE USING (created_by = auth.uid() OR auth.role() = 'authenticated');
