import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
  createPermissionProcedure,
} from "../trpc";
import {
  userListSchema,
  createUserSchema,
  updateUserSchema,
  assignRolesSchema,
  grantPermissionSchema,
} from "../schemas/auth";
import { auditHelpers } from "../utils/audit-logger";

// Permission-based procedures
const canListUsers = createPermissionProcedure("users:list");
const canReadUsers = createPermissionProcedure("users:read");
const canCreateUsers = createPermissionProcedure("users:create");
const canUpdateUsers = createPermissionProcedure("users:update");
const canDeleteUsers = createPermissionProcedure("users:delete");
const canAssignRoles = createPermissionProcedure("roles:assign");

export const usersRouter = createTRPCRouter({
  /**
   * List all users with pagination and filtering
   */
  list: canListUsers.input(userListSchema).query(async ({ input, ctx }) => {
    try {
      const { page, limit, search, sortBy, sortOrder, role, isActive } = input;
      const offset = (page - 1) * limit;

      let query = ctx.supabase.from("user_profiles").select(
        `
            *,
            user_roles!inner(
              role:roles(name)
            )
          `,
        { count: "exact" }
      );

      // Apply filters
      if (search) {
        query = query.or(
          `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
        );
      }

      if (isActive !== undefined) {
        query = query.eq("is_active", isActive);
      }

      if (role) {
        query = query.eq("user_roles.role.name", role);
      }

      // Apply sorting
      const sortColumn =
        sortBy === "firstName"
          ? "first_name"
          : sortBy === "lastName"
            ? "last_name"
            : sortBy === "createdAt"
              ? "created_at"
              : sortBy === "lastLoginAt"
                ? "last_login_at"
                : "email";

      query = query.order(sortColumn, { ascending: sortOrder === "asc" });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      const users =
        data?.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          avatarUrl: user.avatar_url,
          phone: user.phone,
          isActive: user.is_active,
          emailVerified: user.email_verified,
          lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : null,
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at),
          roles:
            user.user_roles?.map((ur: any) => ur.role?.name).filter(Boolean) ||
            [],
        })) || [];

      return {
        users,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch users",
      });
    }
  }),

  /**
   * Get user by ID with detailed information
   */
  getById: canReadUsers
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      try {
        const { id } = input;

        // Fetch user profile
        const { data: profile, error: profileError } = await ctx.supabase
          .from("user_profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (profileError || !profile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Fetch user roles and permissions
        const [rolesResult, permissionsResult] = await Promise.all([
          ctx.supabase.rpc("get_user_roles", { user_id: id }),
          ctx.supabase.rpc("get_user_permissions", { user_id: id }),
        ]);

        return {
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          avatarUrl: profile.avatar_url,
          phone: profile.phone,
          isActive: profile.is_active,
          emailVerified: profile.email_verified,
          lastLoginAt: profile.last_login_at
            ? new Date(profile.last_login_at)
            : null,
          createdAt: new Date(profile.created_at),
          updatedAt: new Date(profile.updated_at),
          roles:
            rolesResult.data?.map((role: any) => ({
              id: role.role_id,
              name: role.role_name,
              description: role.role_description,
              assignedAt: new Date(role.assigned_at),
              expiresAt: role.expires_at ? new Date(role.expires_at) : null,
            })) || [],
          permissions:
            permissionsResult.data?.map((perm: any) => perm.permission_name) ||
            [],
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user",
        });
      }
    }),

  /**
   * Create new user (admin only)
   */
  create: canCreateUsers
    .input(createUserSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const {
          email,
          password,
          firstName,
          lastName,
          roles,
          sendWelcomeEmail,
        } = input;

        // Create user with Supabase Auth
        const { data, error } = await ctx.supabase.auth.admin.createUser({
          email,
          password,
          user_metadata: {
            first_name: firstName || null,
            last_name: lastName || null,
          },
          email_confirm: true, // Auto-confirm email for admin-created users
        });

        if (error || !data.user) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error?.message || "Failed to create user",
          });
        }

        // Assign roles if provided
        if (roles && roles.length > 0) {
          const { data: roleData } = await ctx.supabase
            .from("roles")
            .select("id, name")
            .in("name", roles);

          if (roleData && roleData.length > 0) {
            const roleAssignments = roleData.map(role => ({
              user_id: data.user.id,
              role_id: role.id,
              assigned_by: ctx.user.id,
            }));

            await ctx.supabase.from("user_roles").insert(roleAssignments);
          }
        }

        // Log user creation
        await auditHelpers.userModifiedByAdmin(data.user.id, ctx.user.id, {
          action: "created",
          email,
          roles: roles || [],
        });

        return {
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
          },
          message: "User created successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user",
        });
      }
    }),

  /**
   * Update user information
   */
  update: canUpdateUsers
    .input(updateUserSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const {
          id,
          email,
          firstName,
          lastName,
          phone,
          isActive,
          emailVerified,
        } = input;

        // Check if user can update this user (admin or self)
        const canUpdate =
          ctx.user.roles?.includes("admin") ||
          ctx.user.roles?.includes("super_admin") ||
          ctx.user.id === id;

        if (!canUpdate) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only update your own profile",
          });
        }

        const updates: any = {
          updated_at: new Date().toISOString(),
        };

        if (firstName !== undefined) updates.first_name = firstName || null;
        if (lastName !== undefined) updates.last_name = lastName || null;
        if (phone !== undefined) updates.phone = phone || null;

        // Only admins can update these fields
        if (
          ctx.user.roles?.includes("admin") ||
          ctx.user.roles?.includes("super_admin")
        ) {
          if (email !== undefined) updates.email = email;
          if (isActive !== undefined) updates.is_active = isActive;
          if (emailVerified !== undefined)
            updates.email_verified = emailVerified;
        }

        const { data, error } = await ctx.supabase
          .from("user_profiles")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        // Log user modification if done by admin
        if (ctx.user.id !== id) {
          await auditHelpers.userModifiedByAdmin(id, ctx.user.id, { updates });
        }

        return {
          success: true,
          user: {
            id: data.id,
            email: data.email,
            firstName: data.first_name,
            lastName: data.last_name,
            phone: data.phone,
            isActive: data.is_active,
            emailVerified: data.email_verified,
            lastLoginAt: data.last_login_at
              ? new Date(data.last_login_at)
              : null,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
          },
          message: "User updated successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user",
        });
      }
    }),

  /**
   * Deactivate user (soft delete)
   */
  deactivate: canDeleteUsers
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { id } = input;

        // Prevent self-deactivation
        if (ctx.user.id === id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot deactivate your own account",
          });
        }

        const { error } = await ctx.supabase
          .from("user_profiles")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        // Log user deactivation
        await auditHelpers.userModifiedByAdmin(id, ctx.user.id, {
          action: "deactivated",
        });

        return {
          success: true,
          message: "User deactivated successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to deactivate user",
        });
      }
    }),

  /**
   * Assign roles to user
   */
  assignRoles: canAssignRoles
    .input(assignRolesSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { userId, roleIds } = input;

        // Remove existing roles
        await ctx.supabase.from("user_roles").delete().eq("user_id", userId);

        // Assign new roles
        if (roleIds.length > 0) {
          const roleAssignments = roleIds.map(roleId => ({
            user_id: userId,
            role_id: roleId,
            assigned_by: ctx.user.id,
          }));

          const { error } = await ctx.supabase
            .from("user_roles")
            .insert(roleAssignments);

          if (error) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
            });
          }
        }

        // Log role assignment
        await auditHelpers.userModifiedByAdmin(userId, ctx.user.id, {
          action: "roles_assigned",
          roleIds,
        });

        return {
          success: true,
          message: "Roles assigned successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to assign roles",
        });
      }
    }),

  /**
   * Grant or revoke direct permission to user
   */
  grantPermission: adminProcedure
    .input(grantPermissionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { userId, permissionId, granted, reason, expiresAt } = input;

        // Check if permission override already exists
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
              reason: reason || null,
              expires_at: expiresAt?.toISOString() || null,
              assigned_by: ctx.user.id,
              assigned_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

          if (error) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
            });
          }
        } else {
          // Create new permission
          const { error } = await ctx.supabase.from("user_permissions").insert({
            user_id: userId,
            permission_id: permissionId,
            granted,
            reason: reason || null,
            expires_at: expiresAt?.toISOString() || null,
            assigned_by: ctx.user.id,
          });

          if (error) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
            });
          }
        }

        // Log permission change
        await auditHelpers.userModifiedByAdmin(userId, ctx.user.id, {
          action: granted ? "permission_granted" : "permission_revoked",
          permissionId,
          reason,
          expiresAt,
        });

        return {
          success: true,
          message: `Permission ${granted ? "granted" : "revoked"} successfully`,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update permission",
        });
      }
    }),
});
