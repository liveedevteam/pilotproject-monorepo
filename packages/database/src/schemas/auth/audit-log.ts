import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  inet,
} from "drizzle-orm/pg-core";
import { userProfiles } from "./user-profiles";

// Audit log table
export const authAuditLog = pgTable("auth_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => userProfiles.id),
  action: varchar("action", { length: 50 }).notNull(), // 'login', 'logout', 'role_assigned', etc.
  resource: varchar("resource", { length: 50 }),
  resourceId: uuid("resource_id"),
  details: jsonb("details"),
  ipAddress: inet("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
