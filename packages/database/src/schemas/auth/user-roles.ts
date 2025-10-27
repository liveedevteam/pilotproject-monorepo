import { pgTable, uuid, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { userProfiles } from "./user-profiles";
import { roles } from "./roles";

// User-Role assignment table
export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    assignedBy: uuid("assigned_by").references(() => userProfiles.id),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"), // Optional expiration
    isActive: boolean("is_active").default(true).notNull(),
  },
  table => ({
    uniqueUserRole: unique().on(table.userId, table.roleId),
  })
);
