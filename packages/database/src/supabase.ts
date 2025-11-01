import { createClient } from "@supabase/supabase-js";

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client for admin operations
export const createServiceSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Default export for backward compatibility
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Basic client creation without Next.js dependencies
export const createServerSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
};
