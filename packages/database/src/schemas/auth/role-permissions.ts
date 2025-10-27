import { pgTable, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { roles } from "./roles";
import { permissions } from "./permissions";

// Role-Permission mapping table
export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  table => ({
    uniqueRolePermission: unique().on(table.roleId, table.permissionId),
  })
);
