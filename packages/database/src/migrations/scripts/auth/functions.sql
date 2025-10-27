-- Function to check if user has permission
CREATE OR REPLACE FUNCTION public.user_has_permission(
  user_id UUID,
  permission_name TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check direct user permissions first (can override role permissions)
  IF EXISTS (
    SELECT 1 FROM public.user_permissions up
    JOIN public.permissions p ON up.permission_id = p.id
    WHERE up.user_id = user_has_permission.user_id
    AND p.name = permission_name
    AND (up.expires_at IS NULL OR up.expires_at > NOW())
  ) THEN
    RETURN (
      SELECT up.granted FROM public.user_permissions up
      JOIN public.permissions p ON up.permission_id = p.id
      WHERE up.user_id = user_has_permission.user_id
      AND p.name = permission_name
      AND (up.expires_at IS NULL OR up.expires_at > NOW())
      ORDER BY up.assigned_at DESC
      LIMIT 1
    );
  END IF;

  -- Check role-based permissions
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_has_permission.user_id
    AND p.name = permission_name
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id UUID)
RETURNS TABLE(permission_name TEXT, resource TEXT, action TEXT, granted_by TEXT) AS $$
BEGIN
  RETURN QUERY
  -- Role-based permissions
  SELECT DISTINCT p.name, p.resource, p.action, 'role'::TEXT as granted_by
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON ur.role_id = rp.role_id
  JOIN public.permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = get_user_permissions.user_id
  AND ur.is_active = true
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  
  UNION
  
  -- Direct user permissions (granted)
  SELECT p.name, p.resource, p.action, 'direct'::TEXT as granted_by
  FROM public.user_permissions up
  JOIN public.permissions p ON up.permission_id = p.id
  WHERE up.user_id = get_user_permissions.user_id
  AND up.granted = true
  AND (up.expires_at IS NULL OR up.expires_at > NOW())
  
  EXCEPT
  
  -- Subtract denied permissions
  SELECT p.name, p.resource, p.action, 'direct'::TEXT as granted_by
  FROM public.user_permissions up
  JOIN public.permissions p ON up.permission_id = p.id
  WHERE up.user_id = get_user_permissions.user_id
  AND up.granted = false
  AND (up.expires_at IS NULL OR up.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(user_id UUID)
RETURNS TABLE(role_id UUID, role_name TEXT, role_description TEXT, assigned_at TIMESTAMPTZ, expires_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.name, r.description, ur.assigned_at, ur.expires_at
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = get_user_roles.user_id
  AND ur.is_active = true
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ORDER BY ur.assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign default role to new users
CREATE OR REPLACE FUNCTION public.assign_default_role(user_id UUID)
RETURNS VOID AS $$
DECLARE
  default_role_id UUID;
BEGIN
  -- Get the default 'user' role
  SELECT id INTO default_role_id
  FROM public.roles
  WHERE name = 'user'
  AND is_active = true
  LIMIT 1;

  -- Assign the default role if it exists and user doesn't already have it
  IF default_role_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = assign_default_role.user_id
    AND role_id = default_role_id
  ) THEN
    INSERT INTO public.user_roles (user_id, role_id, assigned_by)
    VALUES (assign_default_role.user_id, default_role_id, NULL);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user profile from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (
    id,
    email,
    first_name,
    last_name,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email_confirmed_at IS NOT NULL,
    NOW(),
    NOW()
  );

  -- Assign default role
  PERFORM public.assign_default_role(NEW.id);

  -- Log registration event
  INSERT INTO public.auth_audit_log (
    user_id,
    action,
    resource,
    details,
    created_at
  )
  VALUES (
    NEW.id,
    'user_registration',
    'authentication',
    jsonb_build_object(
      'email', NEW.email,
      'provider', COALESCE(NEW.app_metadata->>'provider', 'email')
    ),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user profile timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log authentication events
CREATE OR REPLACE FUNCTION public.log_auth_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.auth_audit_log (
    user_id,
    action,
    resource,
    details,
    ip_address,
    user_agent,
    created_at
  )
  VALUES (
    p_user_id,
    p_action,
    p_resource,
    p_details,
    p_ip_address,
    p_user_agent,
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for updating timestamps
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();