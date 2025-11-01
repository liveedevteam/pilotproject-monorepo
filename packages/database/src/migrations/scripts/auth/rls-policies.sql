-- Enable Row Level Security on all authentication tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.user_profiles;

DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.roles;
DROP POLICY IF EXISTS "Super admin can create roles" ON public.roles;
DROP POLICY IF EXISTS "Super admin can update roles" ON public.roles;
DROP POLICY IF EXISTS "Super admin can delete non-system roles" ON public.roles;
DROP POLICY IF EXISTS "Role managers can modify roles" ON public.roles;

DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.permissions;
DROP POLICY IF EXISTS "Super admin can create permissions" ON public.permissions;
DROP POLICY IF EXISTS "Super admin can update permissions" ON public.permissions;
DROP POLICY IF EXISTS "Super admin can delete permissions" ON public.permissions;

DROP POLICY IF EXISTS "Role managers can view role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Role managers can modify role permissions" ON public.role_permissions;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Role managers can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Role managers can assign user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Role managers can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Role managers can remove user roles" ON public.user_roles;
DROP POLICY IF EXISTS "System can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Role managers can modify user roles" ON public.user_roles;

DROP POLICY IF EXISTS "Users can view own permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Permission managers can view all user permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Permission managers can grant user permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Permission managers can update user permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Permission managers can revoke user permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Permission managers can modify user permissions" ON public.user_permissions;

DROP POLICY IF EXISTS "Users can view own audit logs" ON public.auth_audit_log;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.auth_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.auth_audit_log;
DROP POLICY IF EXISTS "No updates to audit logs" ON public.auth_audit_log;
DROP POLICY IF EXISTS "Super admin can delete old audit logs" ON public.auth_audit_log;

-- User Profiles Policies
-- Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('super_admin', 'admin')
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('super_admin', 'admin')
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- Admins can insert new user profiles (for admin user creation)
CREATE POLICY "Admins can insert profiles" ON public.user_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('super_admin', 'admin')
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- System can insert profiles (for new user registration via trigger)
CREATE POLICY "System can insert profiles" ON public.user_profiles
  FOR INSERT WITH CHECK (true);

-- Roles Policies
-- Authenticated users can view roles
CREATE POLICY "Authenticated users can view roles" ON public.roles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only super_admin can create new roles
CREATE POLICY "Super admin can create roles" ON public.roles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'super_admin'
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- Super admin can update roles, but system roles cannot be deleted
CREATE POLICY "Super admin can update roles" ON public.roles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'super_admin'
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- Super admin can delete non-system roles only
CREATE POLICY "Super admin can delete non-system roles" ON public.roles
  FOR DELETE USING (
    NOT is_system AND
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'super_admin'
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- Permissions Policies
-- Authenticated users can view permissions (needed for UI)
CREATE POLICY "Authenticated users can view permissions" ON public.permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only super admin can create new permissions
CREATE POLICY "Super admin can create permissions" ON public.permissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'super_admin'
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- Only super admin can update permissions
CREATE POLICY "Super admin can update permissions" ON public.permissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'super_admin'
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- Only super admin can delete permissions
CREATE POLICY "Super admin can delete permissions" ON public.permissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'super_admin'
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- Role Permissions Policies
-- Role managers can view and modify role permissions
CREATE POLICY "Role managers can view role permissions" ON public.role_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('super_admin', 'admin')
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

CREATE POLICY "Role managers can modify role permissions" ON public.role_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('super_admin', 'admin')
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- User Roles Policies
-- Users can view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Role managers can view all user roles
CREATE POLICY "Role managers can view all user roles" ON public.user_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('super_admin', 'admin')
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- Role managers can assign roles to users
CREATE POLICY "Role managers can assign user roles" ON public.user_roles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('super_admin', 'admin')
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- Role managers can update user role assignments
CREATE POLICY "Role managers can update user roles" ON public.user_roles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('super_admin', 'admin')
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- Role managers can remove user role assignments
CREATE POLICY "Role managers can remove user roles" ON public.user_roles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('super_admin', 'admin')
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- System can insert user roles (for default role assignment via trigger)
CREATE POLICY "System can insert user roles" ON public.user_roles
  FOR INSERT WITH CHECK (true);

-- User Permissions Policies
-- Users can view their own direct permissions
CREATE POLICY "Users can view own permissions" ON public.user_permissions
  FOR SELECT USING (user_id = auth.uid());

-- Permission managers can view all user permissions
CREATE POLICY "Permission managers can view all user permissions" ON public.user_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('super_admin', 'admin')
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- Permission managers can grant direct user permissions
CREATE POLICY "Permission managers can grant user permissions" ON public.user_permissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('super_admin', 'admin')
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- Permission managers can update user permissions
CREATE POLICY "Permission managers can update user permissions" ON public.user_permissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('super_admin', 'admin')
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- Permission managers can revoke user permissions
CREATE POLICY "Permission managers can revoke user permissions" ON public.user_permissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('super_admin', 'admin')
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- Audit Log Policies
-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" ON public.auth_audit_log
  FOR SELECT USING (user_id = auth.uid());

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs" ON public.auth_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('super_admin', 'admin')
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );

-- Only the system can insert audit logs
CREATE POLICY "System can insert audit logs" ON public.auth_audit_log
  FOR INSERT WITH CHECK (true);

-- Audit logs are immutable - no updates allowed
CREATE POLICY "No updates to audit logs" ON public.auth_audit_log
  FOR UPDATE USING (false);

-- Only super admin can delete old audit logs (for maintenance)
CREATE POLICY "Super admin can delete old audit logs" ON public.auth_audit_log
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'super_admin'
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    )
  );