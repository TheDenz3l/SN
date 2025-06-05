-- Phase 3 Database Schema Extensions
-- Team/Organizational Accounts, Templates, and Advanced Features

-- Organization/Team Management
CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'manager', 'member', 'viewer');
CREATE TYPE organization_status AS ENUM ('active', 'suspended', 'trial', 'expired');
CREATE TYPE template_visibility AS ENUM ('private', 'team', 'organization', 'public');
CREATE TYPE template_category AS ENUM ('isp', 'progress_note', 'assessment', 'treatment_plan', 'custom');

-- Organizations Table
CREATE TABLE organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier
    description TEXT,
    status organization_status DEFAULT 'trial' NOT NULL,
    max_members INTEGER DEFAULT 10 NOT NULL,
    max_credits INTEGER DEFAULT 1000 NOT NULL,
    settings JSONB DEFAULT '{}' NOT NULL, -- Organization-wide settings
    billing_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Organization Members
CREATE TABLE organization_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role organization_role DEFAULT 'member' NOT NULL,
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    permissions JSONB DEFAULT '{}' NOT NULL, -- Custom permissions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(organization_id, user_id)
);

-- Organization Invitations
CREATE TABLE organization_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    email VARCHAR(255) NOT NULL,
    role organization_role DEFAULT 'member' NOT NULL,
    invited_by UUID REFERENCES auth.users(id) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(organization_id, email)
);

-- Template Library
CREATE TABLE templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category template_category DEFAULT 'custom' NOT NULL,
    visibility template_visibility DEFAULT 'private' NOT NULL,
    content JSONB NOT NULL, -- Template structure and content
    tags TEXT[] DEFAULT '{}', -- Searchable tags
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    organization_id UUID REFERENCES organizations(id), -- NULL for personal templates
    usage_count INTEGER DEFAULT 0 NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE NOT NULL,
    version INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Template Usage Analytics
CREATE TABLE template_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_id UUID REFERENCES templates(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    modifications JSONB, -- Track what was modified from template
    generated_note_id UUID REFERENCES notes(id) ON DELETE SET NULL
);

-- User Analytics and Activity Tracking
CREATE TABLE user_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    notes_generated INTEGER DEFAULT 0 NOT NULL,
    credits_used INTEGER DEFAULT 0 NOT NULL,
    time_saved_minutes INTEGER DEFAULT 0 NOT NULL, -- Estimated time saved
    ai_generations INTEGER DEFAULT 0 NOT NULL,
    templates_used INTEGER DEFAULT 0 NOT NULL,
    active_time_minutes INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, date)
);

-- Organization Analytics
CREATE TABLE organization_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    total_members INTEGER DEFAULT 0 NOT NULL,
    active_members INTEGER DEFAULT 0 NOT NULL,
    notes_generated INTEGER DEFAULT 0 NOT NULL,
    credits_used INTEGER DEFAULT 0 NOT NULL,
    templates_created INTEGER DEFAULT 0 NOT NULL,
    templates_used INTEGER DEFAULT 0 NOT NULL,
    total_time_saved_minutes INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(organization_id, date)
);

-- Shared ISP Tasks (Team Templates)
CREATE TABLE shared_isp_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tasks JSONB NOT NULL, -- Array of task objects
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    usage_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Update user_profiles to support organization membership
ALTER TABLE user_profiles ADD COLUMN primary_organization_id UUID REFERENCES organizations(id);
ALTER TABLE user_profiles ADD COLUMN role VARCHAR(50) DEFAULT 'user'; -- user, admin, super_admin
ALTER TABLE user_profiles ADD COLUMN preferences JSONB DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update notes table to support organization context
ALTER TABLE notes ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE notes ADD COLUMN template_id UUID REFERENCES templates(id);
ALTER TABLE notes ADD COLUMN shared_with TEXT[] DEFAULT '{}'; -- User IDs who can view this note

-- Indexes for performance
CREATE INDEX idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX idx_organization_invitations_email ON organization_invitations(email);
CREATE INDEX idx_organization_invitations_token ON organization_invitations(token);
CREATE INDEX idx_templates_organization_id ON templates(organization_id);
CREATE INDEX idx_templates_created_by ON templates(created_by);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_visibility ON templates(visibility);
CREATE INDEX idx_template_usage_template_id ON template_usage(template_id);
CREATE INDEX idx_template_usage_user_id ON template_usage(user_id);
CREATE INDEX idx_user_analytics_user_date ON user_analytics(user_id, date);
CREATE INDEX idx_organization_analytics_org_date ON organization_analytics(organization_id, date);
CREATE INDEX idx_notes_organization_id ON notes(organization_id);
CREATE INDEX idx_notes_template_id ON notes(template_id);
CREATE INDEX idx_user_profiles_org_id ON user_profiles(primary_organization_id);

-- Row Level Security Policies

-- Organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Organization Members
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view organization members" ON organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Templates
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view accessible templates" ON templates
  FOR SELECT USING (
    visibility = 'public' OR
    created_by = auth.uid() OR
    (visibility = 'organization' AND organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )) OR
    (visibility = 'team' AND organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    ))
  );

-- User Analytics
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own analytics" ON user_analytics
  FOR SELECT USING (user_id = auth.uid());

-- Organization Analytics
ALTER TABLE organization_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organization members can view org analytics" ON organization_analytics
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- Functions and Triggers

-- Function to update organization analytics
CREATE OR REPLACE FUNCTION update_organization_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update daily analytics when notes are created
  IF TG_OP = 'INSERT' AND NEW.organization_id IS NOT NULL THEN
    INSERT INTO organization_analytics (organization_id, date, notes_generated)
    VALUES (NEW.organization_id, CURRENT_DATE, 1)
    ON CONFLICT (organization_id, date)
    DO UPDATE SET 
      notes_generated = organization_analytics.notes_generated + 1,
      created_at = NOW();
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for organization analytics
CREATE TRIGGER trigger_update_organization_analytics
  AFTER INSERT OR UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_analytics();

-- Function to update user analytics
CREATE OR REPLACE FUNCTION update_user_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update daily analytics when notes are created
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_analytics (user_id, organization_id, date, notes_generated, time_saved_minutes)
    VALUES (NEW.user_id, NEW.organization_id, CURRENT_DATE, 1, 15) -- Assume 15 minutes saved per note
    ON CONFLICT (user_id, date)
    DO UPDATE SET 
      notes_generated = user_analytics.notes_generated + 1,
      time_saved_minutes = user_analytics.time_saved_minutes + 15,
      created_at = NOW();
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for user analytics
CREATE TRIGGER trigger_update_user_analytics
  AFTER INSERT ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_user_analytics();
