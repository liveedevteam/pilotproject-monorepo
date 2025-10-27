import { db } from "../../../core/client";
import { authRolesData } from "../data/auth-roles";
import { authPermissionsData } from "../data/auth-permissions";
import { roles, permissions, rolePermissions } from "../../../schemas/auth";

export class SeedRunner {
  async seedAuthRoles(): Promise<void> {
    console.log("Seeding authentication roles...");

    try {
      await db.insert(roles).values(authRolesData).onConflictDoNothing();

      console.log(`Successfully seeded ${authRolesData.length} roles`);
    } catch (error) {
      console.error("Error seeding auth roles:", error);
      throw error;
    }
  }

  async seedAuthPermissions(): Promise<void> {
    console.log("Seeding authentication permissions...");

    try {
      await db
        .insert(permissions)
        .values(authPermissionsData)
        .onConflictDoNothing();

      console.log(
        `Successfully seeded ${authPermissionsData.length} permissions`
      );
    } catch (error) {
      console.error("Error seeding auth permissions:", error);
      throw error;
    }
  }

  async seedRolePermissions(): Promise<void> {
    console.log("Seeding role-permission assignments...");

    try {
      // Get all roles and permissions to create mappings
      const allRoles = await db.select().from(roles);
      const allPermissions = await db.select().from(permissions);

      // Create role-permission mappings
      const rolePermissionMappings = [];

      // Super admin gets all permissions
      const superAdminRole = allRoles.find(r => r.name === "super_admin");
      if (superAdminRole) {
        for (const permission of allPermissions) {
          rolePermissionMappings.push({
            roleId: superAdminRole.id,
            permissionId: permission.id,
          });
        }
      }

      // Admin gets most permissions (excluding super admin specific ones)
      const adminRole = allRoles.find(r => r.name === "admin");
      if (adminRole) {
        const adminPermissions = allPermissions.filter(
          p => !p.name.includes("system.") || p.name === "system.read"
        );

        for (const permission of adminPermissions) {
          rolePermissionMappings.push({
            roleId: adminRole.id,
            permissionId: permission.id,
          });
        }
      }

      // Manager gets user and content management permissions
      const managerRole = allRoles.find(r => r.name === "manager");
      if (managerRole) {
        const managerPermissions = allPermissions.filter(
          p => p.resource === "users" || p.resource === "content"
        );

        for (const permission of managerPermissions) {
          rolePermissionMappings.push({
            roleId: managerRole.id,
            permissionId: permission.id,
          });
        }
      }

      // User gets basic read permissions
      const userRole = allRoles.find(r => r.name === "user");
      if (userRole) {
        const userPermissions = allPermissions.filter(
          p =>
            p.action === "read" &&
            (p.resource === "users" || p.resource === "content")
        );

        for (const permission of userPermissions) {
          rolePermissionMappings.push({
            roleId: userRole.id,
            permissionId: permission.id,
          });
        }
      }

      if (rolePermissionMappings.length > 0) {
        await db
          .insert(rolePermissions)
          .values(rolePermissionMappings)
          .onConflictDoNothing();

        console.log(
          `Successfully seeded ${rolePermissionMappings.length} role-permission assignments`
        );
      }
    } catch (error) {
      console.error("Error seeding role permissions:", error);
      throw error;
    }
  }

  async seedAll(): Promise<void> {
    console.log("Starting complete database seeding...");

    try {
      await this.seedAuthRoles();
      await this.seedAuthPermissions();
      await this.seedRolePermissions();

      console.log("Database seeding completed successfully");
    } catch (error) {
      console.error("Database seeding failed:", error);
      throw error;
    }
  }
}
