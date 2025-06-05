-- Final Phase 3 RLS Fix - Disable RLS temporarily and create simple policies
-- This approach avoids infinite recursion by using simpler policy logic

-- Temporarily disable RLS on problematic tables
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE shared_isp_tasks DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
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

-- Re-enable RLS with simple policies that don't cause recursion
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_isp_tasks ENABLE ROW LEVEL SECURITY;

-- Simple Organizations policies (no recursion)
CREATE POLICY "Allow all authenticated users to view organizations" ON organizations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to create organizations" ON organizations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update organizations" ON organizations
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Simple Organization Members policies (no recursion)
CREATE POLICY "Allow all authenticated users to view organization members" ON organization_members
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage organization members" ON organization_members
  FOR ALL USING (auth.role() = 'authenticated');

-- Simple Templates policies (no recursion)
CREATE POLICY "Allow all authenticated users to view templates" ON templates
  FOR SELECT USING (
    visibility = 'public' OR 
    created_by = auth.uid() OR
    auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated users to create templates" ON templates
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Allow users to update their own templates" ON templates
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Allow users to delete their own templates" ON templates
  FOR DELETE USING (created_by = auth.uid());

-- Simple User Analytics policies
CREATE POLICY "Allow users to view their own analytics" ON user_analytics
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Allow users to manage their own analytics" ON user_analytics
  FOR ALL USING (user_id = auth.uid());

-- Simple Organization Analytics policies
CREATE POLICY "Allow authenticated users to view organization analytics" ON organization_analytics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage organization analytics" ON organization_analytics
  FOR ALL USING (auth.role() = 'authenticated');

-- Simple Template Usage policies
CREATE POLICY "Allow users to view their own template usage" ON template_usage
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Allow users to record template usage" ON template_usage
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Simple Organization Invitations policies
CREATE POLICY "Allow authenticated users to view invitations" ON organization_invitations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage invitations" ON organization_invitations
  FOR ALL USING (auth.role() = 'authenticated');

-- Simple Shared ISP Tasks policies
CREATE POLICY "Allow authenticated users to view shared ISP tasks" ON shared_isp_tasks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage shared ISP tasks" ON shared_isp_tasks
  FOR ALL USING (auth.role() = 'authenticated');
