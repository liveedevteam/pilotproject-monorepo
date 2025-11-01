import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
  createPermissionProcedure,
} from "../trpc";

// Permission-based procedures
const canManageRoles = createPermissionProcedure("roles:manage");
const canViewRoles = createPermissionProcedure("roles:read");
const canAssignPermissions = createPermissionProcedure("permissions:assign");

// System roles that cannot be deleted
const SYSTEM_ROLES = ["super_admin", "admin", "manager", "user", "guest"];

export const rolesRouter = createTRPCRouter({
  /**
   * List all roles with their permissions
   */
  list: canViewRoles
    .input(
      z.object({
        includeSystem: z.boolean().default(true),
        includeInactive: z.boolean().default(false),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const { includeSystem, includeInactive } = input;

        let query = ctx.supabase.from("roles").select(`
            *,
            role_permissions(
              permission:permissions(*)
            )
          `);

        // Filter system roles if requested
        if (!includeSystem) {
          query = query.eq("is_system", false);
        }

        // Filter inactive roles if requested
        if (!includeInactive) {
          query = query.eq("is_active", true);
        }

        query = query.order("name");

        const { data: roles, error } = await query;

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }

        return {
          roles:
            roles?.map(role => ({
              id: role.id,
              name: role.name,
              description: role.description,
              isSystem: role.is_system,
              isActive: role.is_active,
              createdAt: new Date(role.created_at),
              updatedAt: new Date(role.updated_at),
              permissions:
                role.role_permissions?.map((rp: any) => ({
                  id: rp.permission.id,
                  name: rp.permission.name,
                  description: rp.permission.description,
                  resource: rp.permission.resource,
                  action: rp.permission.action,
                })) || [],
            })) || [],
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch roles",
        });
      }
    }),

  /**
   * Get role by ID with detailed information
   */
  getById: canViewRoles
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      try {
        const { data: role, error } = await ctx.supabase
          .from("roles")
          .select(
            `
            *,
            role_permissions(
              permission:permissions(*)
            ),
            user_roles(
              user:user_profiles(id, email, first_name, last_name)
            )
          `
          )
          .eq("id", input.id)
          .single();

        if (error) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Role not found",
          });
        }

        return {
          id: role.id,
          name: role.name,
          description: role.description,
          isSystem: role.is_system,
          isActive: role.is_active,
          createdAt: new Date(role.created_at),
          updatedAt: new Date(role.updated_at),
          permissions:
            role.role_permissions?.map((rp: any) => ({
              id: rp.permission.id,
              name: rp.permission.name,
              description: rp.permission.description,
              resource: rp.permission.resource,
              action: rp.permission.action,
            })) || [],
          assignedUsers:
            role.user_roles?.map((ur: any) => ({
              id: ur.user.id,
              email: ur.user.email,
              firstName: ur.user.first_name,
              lastName: ur.user.last_name,
            })) || [],
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch role",
        });
      }
    }),

  /**
   * Create new role
   */
  create: canManageRoles
    .input(
      z.object({
        name: z.string().min(1).max(50),
        description: z.string().optional(),
        permissionIds: z.array(z.string().uuid()).default([]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { name, description, permissionIds } = input;

        // Check if role name already exists
        const { data: existingRole } = await ctx.supabase
          .from("roles")
          .select("id")
          .eq("name", name)
          .single();

        if (existingRole) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Role name already exists",
          });
        }

        // Create the role
        const { data: role, error: roleError } = await ctx.supabase
          .from("roles")
          .insert({
            name,
            description,
            is_system: false,
            is_active: true,
          })
          .select()
          .single();

        if (roleError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: roleError.message,
          });
        }

        // Assign permissions if provided
        if (permissionIds.length > 0) {
          const rolePermissions = permissionIds.map(permissionId => ({
            role_id: role.id,
            permission_id: permissionId,
          }));

          const { error: permError } = await ctx.supabase
            .from("role_permissions")
            .insert(rolePermissions);

          if (permError) {
            // Rollback role creation
            await ctx.supabase.from("roles").delete().eq("id", role.id);
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Failed to assign permissions to role",
            });
          }
        }

        return {
          id: role.id,
          name: role.name,
          description: role.description,
          isSystem: role.is_system,
          isActive: role.is_active,
          createdAt: new Date(role.created_at),
          updatedAt: new Date(role.updated_at),
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create role",
        });
      }
    }),

  /**
   * Update role information
   */
  update: canManageRoles
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(50).optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, ...updates } = input;

        // Check if role exists and get current data
        const { data: currentRole, error: fetchError } = await ctx.supabase
          .from("roles")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchError || !currentRole) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Role not found",
          });
        }

        // Prevent modification of system roles
        if (currentRole.is_system && SYSTEM_ROLES.includes(currentRole.name)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cannot modify system roles",
          });
        }

        // Check for name conflicts if name is being updated
        if (updates.name && updates.name !== currentRole.name) {
          const { data: existingRole } = await ctx.supabase
            .from("roles")
            .select("id")
            .eq("name", updates.name)
            .neq("id", id)
            .single();

          if (existingRole) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Role name already exists",
            });
          }
        }

        // Update the role
        const { data: role, error } = await ctx.supabase
          .from("roles")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();

        if (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        return {
          id: role.id,
          name: role.name,
          description: role.description,
          isSystem: role.is_system,
          isActive: role.is_active,
          createdAt: new Date(role.created_at),
          updatedAt: new Date(role.updated_at),
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update role",
        });
      }
    }),

  /**
   * Delete role (soft delete for system roles)
   */
  delete: canManageRoles
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if role exists
        const { data: role, error: fetchError } = await ctx.supabase
          .from("roles")
          .select("*")
          .eq("id", input.id)
          .single();

        if (fetchError || !role) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Role not found",
          });
        }

        // Prevent deletion of system roles
        if (role.is_system && SYSTEM_ROLES.includes(role.name)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cannot delete system roles",
          });
        }

        // Check if role is assigned to any users
        const { data: assignedUsers, error: userError } = await ctx.supabase
          .from("user_roles")
          .select("user_id")
          .eq("role_id", input.id)
          .eq("is_active", true);

        if (userError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to check role assignments",
          });
        }

        if (assignedUsers && assignedUsers.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Cannot delete role: assigned to ${assignedUsers.length} user(s)`,
          });
        }

        // Delete the role
        const { error } = await ctx.supabase
          .from("roles")
          .delete()
          .eq("id", input.id);

        if (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        return { success: true, message: "Role deleted successfully" };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete role",
        });
      }
    }),

  /**
   * Assign permissions to role
   */
  assignPermissions: canAssignPermissions
    .input(
      z.object({
        roleId: z.string().uuid(),
        permissionIds: z.array(z.string().uuid()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { roleId, permissionIds } = input;

        // Verify role exists
        const { data: role, error: roleError } = await ctx.supabase
          .from("roles")
          .select("id, name")
          .eq("id", roleId)
          .single();

        if (roleError || !role) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Role not found",
          });
        }

        // Get current permissions to avoid duplicates
        const { data: currentPermissions } = await ctx.supabase
          .from("role_permissions")
          .select("permission_id")
          .eq("role_id", roleId);

        const currentPermissionIds =
          currentPermissions?.map(p => p.permission_id) || [];
        const newPermissionIds = permissionIds.filter(
          id => !currentPermissionIds.includes(id)
        );

        if (newPermissionIds.length === 0) {
          return { message: "All permissions already assigned to role" };
        }

        // Create role-permission mappings
        const rolePermissions = newPermissionIds.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId,
        }));

        const { error } = await ctx.supabase
          .from("role_permissions")
          .insert(rolePermissions);

        if (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        return {
          success: true,
          message: `Assigned ${newPermissionIds.length} permission(s) to role`,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to assign permissions",
        });
      }
    }),

  /**
   * Remove permissions from role
   */
  removePermissions: canAssignPermissions
    .input(
      z.object({
        roleId: z.string().uuid(),
        permissionIds: z.array(z.string().uuid()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { roleId, permissionIds } = input;

        // Verify role exists
        const { data: role, error: roleError } = await ctx.supabase
          .from("roles")
          .select("id, name")
          .eq("id", roleId)
          .single();

        if (roleError || !role) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Role not found",
          });
        }

        // Remove role-permission mappings
        const { error } = await ctx.supabase
          .from("role_permissions")
          .delete()
          .eq("role_id", roleId)
          .in("permission_id", permissionIds);

        if (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        return {
          success: true,
          message: `Removed ${permissionIds.length} permission(s) from role`,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove permissions",
        });
      }
    }),
});
