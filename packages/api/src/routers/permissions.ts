import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
  createPermissionProcedure,
} from "../trpc";

// Permission-based procedures
const canManagePermissions = createPermissionProcedure("permissions:manage");
const canViewPermissions = createPermissionProcedure("permissions:read");
const canAssignPermissions = createPermissionProcedure("permissions:assign");

export const permissionsRouter = createTRPCRouter({
  /**
   * List all permissions grouped by resource
   */
  list: canViewPermissions
    .input(
      z.object({
        resource: z.string().optional(),
        groupByResource: z.boolean().default(true),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const { resource, groupByResource } = input;

        let query = ctx.supabase
          .from("permissions")
          .select("*")
          .order("resource")
          .order("action");

        if (resource) {
          query = query.eq("resource", resource);
        }

        const { data: permissions, error } = await query;

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }

        const permissionList =
          permissions?.map(permission => ({
            id: permission.id,
            name: permission.name,
            description: permission.description,
            resource: permission.resource,
            action: permission.action,
            conditions: permission.conditions,
            createdAt: new Date(permission.created_at),
          })) || [];

        if (!groupByResource) {
          return { permissions: permissionList };
        }

        // Group by resource
        const grouped = permissionList.reduce(
          (acc, permission) => {
            const resourceKey = permission.resource;
            if (!acc[resourceKey]) {
              acc[resourceKey] = [];
            }
            acc[resourceKey].push(permission);
            return acc;
          },
          {} as Record<string, typeof permissionList>
        );

        return {
          permissions: permissionList,
          groupedByResource: grouped,
          resources: Object.keys(grouped),
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch permissions",
        });
      }
    }),

  /**
   * Get effective permissions for a user
   */
  getUserPermissions: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid().optional(), // If not provided, use current user
        includeExpired: z.boolean().default(false),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const userId = input.userId || ctx.user.id;
        const { includeExpired } = input;

        // Check if user can view other users' permissions
        if (userId !== ctx.user.id) {
          const canViewOthers =
            ctx.user.permissions?.includes("permissions:read") ||
            ctx.user.permissions?.includes("users:read");
          if (!canViewOthers) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Cannot view other users' permissions",
            });
          }
        }

        // Get permissions from roles
        let rolePermissionsQuery = ctx.supabase
          .from("user_roles")
          .select(
            `
            role:roles(
              name,
              role_permissions(
                permission:permissions(*)
              )
            )
          `
          )
          .eq("user_id", userId)
          .eq("is_active", true);

        if (!includeExpired) {
          rolePermissionsQuery = rolePermissionsQuery.or(
            "expires_at.is.null,expires_at.gt.now()"
          );
        }

        // Get direct user permissions
        let directPermissionsQuery = ctx.supabase
          .from("user_permissions")
          .select(
            `
            *,
            permission:permissions(*),
            assigned_by_user:user_profiles!assigned_by(email, first_name, last_name)
          `
          )
          .eq("user_id", userId);

        if (!includeExpired) {
          directPermissionsQuery = directPermissionsQuery.or(
            "expires_at.is.null,expires_at.gt.now()"
          );
        }

        const [rolePermissionsResult, directPermissionsResult] =
          await Promise.all([rolePermissionsQuery, directPermissionsQuery]);

        if (rolePermissionsResult.error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: rolePermissionsResult.error.message,
          });
        }

        if (directPermissionsResult.error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: directPermissionsResult.error.message,
          });
        }

        // Process role permissions
        const rolePermissions = new Map<string, any>();
        rolePermissionsResult.data?.forEach((userRole: any) => {
          userRole.role.role_permissions?.forEach((rp: any) => {
            const permission = rp.permission;
            rolePermissions.set(permission.id, {
              id: permission.id,
              name: permission.name,
              description: permission.description,
              resource: permission.resource,
              action: permission.action,
              source: "role",
              roleName: userRole.role.name,
              granted: true,
            });
          });
        });

        // Process direct permissions (can override role permissions)
        const allPermissions = new Map(rolePermissions);
        directPermissionsResult.data?.forEach((userPerm: any) => {
          const permission = userPerm.permission;
          allPermissions.set(permission.id, {
            id: permission.id,
            name: permission.name,
            description: permission.description,
            resource: permission.resource,
            action: permission.action,
            source: "direct",
            granted: userPerm.granted,
            assignedBy: userPerm.assigned_by_user
              ? {
                  email: userPerm.assigned_by_user.email,
                  firstName: userPerm.assigned_by_user.first_name,
                  lastName: userPerm.assigned_by_user.last_name,
                }
              : null,
            assignedAt: new Date(userPerm.assigned_at),
            expiresAt: userPerm.expires_at
              ? new Date(userPerm.expires_at)
              : null,
            reason: userPerm.reason,
          });
        });

        const effectivePermissions = Array.from(allPermissions.values());
        const grantedPermissions = effectivePermissions.filter(p => p.granted);
        const deniedPermissions = effectivePermissions.filter(p => !p.granted);

        return {
          userId,
          effectivePermissions,
          grantedPermissions,
          deniedPermissions,
          summary: {
            total: effectivePermissions.length,
            granted: grantedPermissions.length,
            denied: deniedPermissions.length,
            fromRoles: effectivePermissions.filter(p => p.source === "role")
              .length,
            direct: effectivePermissions.filter(p => p.source === "direct")
              .length,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user permissions",
        });
      }
    }),

  /**
   * Check if user has specific permission
   */
  checkPermission: protectedProcedure
    .input(
      z.object({
        permission: z.string(),
        userId: z.string().uuid().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const userId = input.userId || ctx.user.id;

        // Use database function for efficient permission checking
        const { data, error } = await ctx.supabase.rpc("user_has_permission", {
          user_id: userId,
          permission_name: input.permission,
        });

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }

        return {
          userId,
          permission: input.permission,
          hasPermission: data || false,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check permission",
        });
      }
    }),

  /**
   * Grant direct permission to user
   */
  grantUserPermission: canAssignPermissions
    .input(
      z.object({
        userId: z.string().uuid(),
        permissionId: z.string().uuid(),
        granted: z.boolean().default(true),
        expiresAt: z.date().optional(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { userId, permissionId, granted, expiresAt, reason } = input;

        // Verify user exists
        const { data: user, error: userError } = await ctx.supabase
          .from("user_profiles")
          .select("id, email")
          .eq("id", userId)
          .single();

        if (userError || !user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Verify permission exists
        const { data: permission, error: permError } = await ctx.supabase
          .from("permissions")
          .select("id, name")
          .eq("id", permissionId)
          .single();

        if (permError || !permission) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Permission not found",
          });
        }

        // Check if permission already assigned
        const { data: existing } = await ctx.supabase
          .from("user_permissions")
          .select("id")
          .eq("user_id", userId)
          .eq("permission_id", permissionId)
          .single();

        if (existing) {
          // Update existing permission
          const { error } = await ctx.supabase
            .from("user_permissions")
            .update({
              granted,
              assigned_by: ctx.user.id,
              assigned_at: new Date().toISOString(),
              expires_at: expiresAt?.toISOString(),
              reason,
            })
            .eq("id", existing.id);

          if (error) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
            });
          }
        } else {
          // Create new permission assignment
          const { error } = await ctx.supabase.from("user_permissions").insert({
            user_id: userId,
            permission_id: permissionId,
            granted,
            assigned_by: ctx.user.id,
            expires_at: expiresAt?.toISOString(),
            reason,
          });

          if (error) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
            });
          }
        }

        return {
          success: true,
          message: `Permission ${granted ? "granted to" : "denied for"} user`,
          details: {
            user: user.email,
            permission: permission.name,
            granted,
            expiresAt,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to grant user permission",
        });
      }
    }),

  /**
   * Revoke direct user permission
   */
  revokeUserPermission: canAssignPermissions
    .input(
      z.object({
        userId: z.string().uuid(),
        permissionId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { userId, permissionId } = input;

        // Delete the user permission
        const { error } = await ctx.supabase
          .from("user_permissions")
          .delete()
          .eq("user_id", userId)
          .eq("permission_id", permissionId);

        if (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        return {
          success: true,
          message: "User permission revoked successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to revoke user permission",
        });
      }
    }),

  /**
   * Bulk update user permissions
   */
  bulkUpdateUserPermissions: canAssignPermissions
    .input(
      z.object({
        userId: z.string().uuid(),
        permissions: z.array(
          z.object({
            permissionId: z.string().uuid(),
            granted: z.boolean(),
            expiresAt: z.date().optional(),
            reason: z.string().optional(),
          })
        ),
        replaceAll: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { userId, permissions, replaceAll } = input;

        // Verify user exists
        const { data: user, error: userError } = await ctx.supabase
          .from("user_profiles")
          .select("id, email")
          .eq("id", userId)
          .single();

        if (userError || !user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // If replaceAll, remove all current direct permissions
        if (replaceAll) {
          const { error: deleteError } = await ctx.supabase
            .from("user_permissions")
            .delete()
            .eq("user_id", userId);

          if (deleteError) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Failed to clear existing permissions",
            });
          }
        }

        // Process each permission
        const results = [];
        for (const perm of permissions) {
          try {
            // Check if permission already exists
            const { data: existing } = await ctx.supabase
              .from("user_permissions")
              .select("id")
              .eq("user_id", userId)
              .eq("permission_id", perm.permissionId)
              .single();

            if (existing && !replaceAll) {
              // Update existing
              await ctx.supabase
                .from("user_permissions")
                .update({
                  granted: perm.granted,
                  assigned_by: ctx.user.id,
                  assigned_at: new Date().toISOString(),
                  expires_at: perm.expiresAt?.toISOString(),
                  reason: perm.reason,
                })
                .eq("id", existing.id);
            } else {
              // Insert new
              await ctx.supabase.from("user_permissions").insert({
                user_id: userId,
                permission_id: perm.permissionId,
                granted: perm.granted,
                assigned_by: ctx.user.id,
                expires_at: perm.expiresAt?.toISOString(),
                reason: perm.reason,
              });
            }

            results.push({
              permissionId: perm.permissionId,
              success: true,
            });
          } catch (error) {
            results.push({
              permissionId: perm.permissionId,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return {
          success: true,
          message: `Bulk update completed: ${successful} successful, ${failed} failed`,
          results,
          summary: {
            total: permissions.length,
            successful,
            failed,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to bulk update permissions",
        });
      }
    }),
});
