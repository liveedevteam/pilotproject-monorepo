-- AUTH-013: Database Triggers for Auto User Setup
-- Creates user profile and assigns default role when new user registers

-- Function to handle new user setup automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id UUID;
  user_role_name TEXT := 'user';
BEGIN
  -- Get the default 'user' role ID
  SELECT id INTO default_role_id 
  FROM public.roles 
  WHERE name = user_role_name AND is_active = true;
  
  -- If no default role found, log error but don't fail
  IF default_role_id IS NULL THEN
    RAISE WARNING 'Default role "%" not found for user %', user_role_name, NEW.id;
  END IF;

  -- Create user profile with data from auth metadata
  INSERT INTO public.user_profiles (
    id,
    email,
    first_name,
    last_name,
    email_verified,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'firstName'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NEW.raw_user_meta_data->>'lastName'),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW())
  );

  -- Assign default role if found
  IF default_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (
      user_id,
      role_id,
      assigned_by,
      assigned_at,
      is_active
    ) VALUES (
      NEW.id,
      default_role_id,
      NULL, -- System assignment
      NOW(),
      true
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't prevent user creation
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user updates (email verification, etc.)
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user profile when auth.users is updated
  UPDATE public.user_profiles SET
    email = NEW.email,
    email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't prevent update
    RAISE WARNING 'Error in handle_user_update for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user deletion (soft delete profile)
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Soft delete user profile and deactivate roles
  UPDATE public.user_profiles SET
    is_active = false,
    updated_at = NOW()
  WHERE id = OLD.id;
  
  UPDATE public.user_roles SET
    is_active = false
  WHERE user_id = OLD.id;
  
  RETURN OLD;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't prevent deletion
    RAISE WARNING 'Error in handle_user_delete for user %: %', OLD.id, SQLERRM;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger for user updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_update();

-- Trigger for user deletion
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_delete();

-- Grant necessary permissions for the functions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_user_update() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_user_delete() TO authenticated, service_role;

-- Add indexes for better performance on user lookup
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(user_id, is_active);

-- Function to manually sync existing users (one-time migration helper)
CREATE OR REPLACE FUNCTION public.sync_existing_users()
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  sync_count INTEGER := 0;
  default_role_id UUID;
BEGIN
  -- Get default role
  SELECT id INTO default_role_id FROM public.roles WHERE name = 'user' AND is_active = true;
  
  -- Sync existing auth.users that don't have profiles
  FOR user_record IN 
    SELECT u.* FROM auth.users u
    LEFT JOIN public.user_profiles p ON u.id = p.id
    WHERE p.id IS NULL
  LOOP
    -- Create profile
    INSERT INTO public.user_profiles (
      id, email, first_name, last_name, email_verified, created_at, updated_at
    ) VALUES (
      user_record.id,
      user_record.email,
      user_record.raw_user_meta_data->>'first_name',
      user_record.raw_user_meta_data->>'last_name',
      COALESCE(user_record.email_confirmed_at IS NOT NULL, false),
      COALESCE(user_record.created_at, NOW()),
      COALESCE(user_record.updated_at, NOW())
    );
    
    -- Assign default role if available and not already assigned
    IF default_role_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role_id, assigned_at, is_active)
      SELECT user_record.id, default_role_id, NOW(), true
      WHERE NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_record.id AND role_id = default_role_id
      );
    END IF;
    
    sync_count := sync_count + 1;
  END LOOP;
  
  RETURN sync_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile and assigns default role when new user registers';
COMMENT ON FUNCTION public.handle_user_update() IS 'Updates user profile when auth.users record is updated';
COMMENT ON FUNCTION public.handle_user_delete() IS 'Soft deletes user profile when auth.users record is deleted';
COMMENT ON FUNCTION public.sync_existing_users() IS 'One-time function to sync existing auth.users with user_profiles';