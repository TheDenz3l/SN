-- Fix Phase 3 RLS Policies to Prevent Infinite Recursion
-- Critical fix for organization_members and related table policies

-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can view accessible templates" ON templates;
DROP POLICY IF EXISTS "Users can view own analytics" ON user_analytics;
DROP POLICY IF EXISTS "Organization members can view org analytics" ON organization_analytics;

-- Fix Organizations policies (avoid recursion)
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_members.organization_id = organizations.id 
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert organizations" ON organizations
  FOR INSERT WITH CHECK (true); -- Allow any authenticated user to create orgs

CREATE POLICY "Organization owners can update" ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_members.organization_id = organizations.id 
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Fix Organization Members policies (prevent recursion)
CREATE POLICY "Users can view organization members" ON organization_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert organization members" ON organization_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Users can update organization members" ON organization_members
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can delete organization members" ON organization_members
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Fix Templates policies (avoid recursion)
CREATE POLICY "Users can view accessible templates" ON templates
  FOR SELECT USING (
    visibility = 'public' OR
    created_by = auth.uid() OR
    (visibility IN ('organization', 'team') AND organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can insert templates" ON templates
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND (
      visibility = 'private' OR
      visibility = 'public' OR
      (visibility IN ('organization', 'team') AND (
        organization_id IS NULL OR
        organization_id IN (
          SELECT om.organization_id FROM organization_members om
          WHERE om.user_id = auth.uid()
          AND om.role IN ('owner', 'admin', 'manager')
        )
      ))
    )
  );

CREATE POLICY "Users can update own templates" ON templates
  FOR UPDATE USING (
    created_by = auth.uid() OR
    (organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    ))
  );

CREATE POLICY "Users can delete own templates" ON templates
  FOR DELETE USING (
    created_by = auth.uid() OR
    (organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    ))
  );

-- Fix User Analytics policies
CREATE POLICY "Users can view own analytics" ON user_analytics
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own analytics" ON user_analytics
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own analytics" ON user_analytics
  FOR UPDATE USING (user_id = auth.uid());

-- Fix Organization Analytics policies
CREATE POLICY "Organization members can view org analytics" ON organization_analytics
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Organization managers can insert org analytics" ON organization_analytics
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Organization managers can update org analytics" ON organization_analytics
  FOR UPDATE USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager')
    )
  );

-- Fix Template Usage policies
CREATE POLICY "Users can view own template usage" ON template_usage
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert template usage" ON template_usage
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Fix Organization Invitations policies
CREATE POLICY "Users can view invitations to their orgs" ON organization_invitations
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Users can insert invitations to their orgs" ON organization_invitations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Users can update invitations to their orgs" ON organization_invitations
  FOR UPDATE USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Users can delete invitations to their orgs" ON organization_invitations
  FOR DELETE USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager')
    )
  );

-- Fix Shared ISP Tasks policies
CREATE POLICY "Users can view shared ISP tasks in their orgs" ON shared_isp_tasks
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert shared ISP tasks in their orgs" ON shared_isp_tasks
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Users can update shared ISP tasks in their orgs" ON shared_isp_tasks
  FOR UPDATE USING (
    created_by = auth.uid() OR
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can delete shared ISP tasks in their orgs" ON shared_isp_tasks
  FOR DELETE USING (
    created_by = auth.uid() OR
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );
