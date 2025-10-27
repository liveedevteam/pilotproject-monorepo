import {
  pgTable,
  uuid,
  boolean,
  timestamp,
  text,
  unique,
} from "drizzle-orm/pg-core";
import { userProfiles } from "./user-profiles";
import { permissions } from "./permissions";

// Direct user permissions table (for exceptions)
export const userPermissions = pgTable(
  "user_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    granted: boolean("granted").default(true).notNull(), // true = grant, false = deny (override)
    assignedBy: uuid("assigned_by").references(() => userProfiles.id),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"),
    reason: text("reason"),
  },
  table => ({
    uniqueUserPermission: unique().on(table.userId, table.permissionId),
  })
);
