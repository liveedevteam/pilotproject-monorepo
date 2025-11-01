// Core exports
export * from "./core";

// Schema exports
export * from "./schemas";

// Repository exports
export * from "./repositories";

// Service exports
export * from "./services";

// Utility exports
export * from "./utils";

// Migration exports
export * from "./migrations/runners";
export * from "./migrations/seed/runners";

// Supabase client exports
export * from "./supabase";

// Legacy exports for backwards compatibility
export { db as client } from "./core/client";
export * from "./schemas/schema";
