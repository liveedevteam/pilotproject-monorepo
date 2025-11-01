import { TRPCError } from "@trpc/server";
import { createServerSupabaseClient } from "@repo/database";
import type { User } from "@supabase/supabase-js";
import { logAuthEvent } from "../utils/audit-logger";

export interface AuthUser extends User {
  profile?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    phone: string | null;
    isActive: boolean;
    emailVerified: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  roles?: string[];
  permissions?: string[];
}

export interface AuthContext {
  user: AuthUser | null;
  isAuthenticated: boolean;
  supabase: ReturnType<typeof createServerSupabaseClient>;
}

export interface AuthenticatedContext extends AuthContext {
  user: AuthUser;
  isAuthenticated: true;
}

/**
 * Creates authentication context for tRPC procedures
 */
export const createAuthContext = async (opts: {
  headers: Headers;
}): Promise<AuthContext> => {
  const supabase = createServerSupabaseClient();

  try {
    // Get user from the Authorization header
    const authHeader = opts.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return {
        user: null,
        isAuthenticated: false,
        supabase,
      };
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        user: null,
        isAuthenticated: false,
        supabase,
      };
    }

    // Fetch user profile, roles, and permissions
    const [profileResult, rolesResult, permissionsResult] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("id", user.id).single(),
      supabase.rpc("get_user_roles", { user_id: user.id }),
      supabase.rpc("get_user_permissions", { user_id: user.id }),
    ]);

    const authUser: AuthUser = {
      ...user,
      profile: profileResult.data
        ? {
            id: profileResult.data.id,
            email: profileResult.data.email,
            firstName: profileResult.data.first_name,
            lastName: profileResult.data.last_name,
            avatarUrl: profileResult.data.avatar_url,
            phone: profileResult.data.phone,
            isActive: profileResult.data.is_active,
            emailVerified: profileResult.data.email_verified,
            lastLoginAt: profileResult.data.last_login_at
              ? new Date(profileResult.data.last_login_at)
              : null,
            createdAt: new Date(profileResult.data.created_at),
            updatedAt: new Date(profileResult.data.updated_at),
          }
        : undefined,
      roles: rolesResult.data?.map((role: any) => role.role_name) || [],
      permissions:
        permissionsResult.data?.map((perm: any) => perm.permission_name) || [],
    };

    return {
      user: authUser,
      isAuthenticated: true,
      supabase,
    };
  } catch (error) {
    console.error("Auth context creation error:", error);
    return {
      user: null,
      isAuthenticated: false,
      supabase,
    };
  }
};

/**
 * Middleware that requires authentication
 */
export const enforceAuth = (ctx: AuthContext): AuthenticatedContext => {
  if (!ctx.isAuthenticated || !ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  return ctx as AuthenticatedContext;
};

/**
 * Middleware that requires specific permission
 */
export const requirePermission =
  (permission: string) =>
  (ctx: AuthContext): AuthenticatedContext => {
    const authCtx = enforceAuth(ctx);

    if (!authCtx.user.permissions?.includes(permission)) {
      // Log unauthorized access attempt
      logAuthEvent({
        userId: authCtx.user.id,
        action: "permission_check_failed",
        resource: "api",
        details: {
          required_permission: permission,
          user_permissions: authCtx.user.permissions || [],
        },
        ipAddress: undefined, // Would need to extract from headers in full implementation
        userAgent: undefined,
      });

      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Permission required: ${permission}`,
      });
    }

    // Log successful permission check
    logAuthEvent({
      userId: authCtx.user.id,
      action: "permission_check_success",
      resource: "api",
      details: {
        required_permission: permission,
      },
      ipAddress: undefined,
      userAgent: undefined,
    });

    return authCtx;
  };

/**
 * Middleware that requires specific role
 */
export const requireRole =
  (role: string) =>
  (ctx: AuthContext): AuthenticatedContext => {
    const authCtx = enforceAuth(ctx);

    if (!authCtx.user.roles?.includes(role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Role required: ${role}`,
      });
    }

    return authCtx;
  };

/**
 * Middleware that requires any of the specified roles
 */
export const requireAnyRole =
  (roles: string[]) =>
  (ctx: AuthContext): AuthenticatedContext => {
    const authCtx = enforceAuth(ctx);

    const hasRole = roles.some(role => authCtx.user.roles?.includes(role));
    if (!hasRole) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `One of these roles required: ${roles.join(", ")}`,
      });
    }

    return authCtx;
  };

/**
 * Middleware that requires admin role (super_admin or admin)
 */
export const requireAdmin = (ctx: AuthContext): AuthenticatedContext => {
  return requireAnyRole(["super_admin", "admin"])(ctx);
};

/**
 * Utility to check if user has permission
 */
export const hasPermission = (
  user: AuthUser | null,
  permission: string
): boolean => {
  return user?.permissions?.includes(permission) ?? false;
};

/**
 * Utility to check if user has role
 */
export const hasRole = (user: AuthUser | null, role: string): boolean => {
  return user?.roles?.includes(role) ?? false;
};

/**
 * Utility to check if user has any of the specified roles
 */
export const hasAnyRole = (user: AuthUser | null, roles: string[]): boolean => {
  return roles.some(role => hasRole(user, role));
};
