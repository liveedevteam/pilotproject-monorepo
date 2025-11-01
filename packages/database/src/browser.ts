// Client-side safe exports only
// This file should only include browser-compatible exports

// Schema exports (types only, no Node.js dependencies)
export * from "./schemas";

// Supabase client exports (browser-compatible)
export {
  createBrowserSupabaseClient,
  createServerSupabaseClient,
  supabase,
} from "./supabase";

// Type exports from core
export type * from "./core/types";
