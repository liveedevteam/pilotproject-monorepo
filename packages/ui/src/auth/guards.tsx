import React from "react";
import { useAuth } from "./AuthProvider";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * Guard component that requires authentication
 */
export function AuthGuard({
  children,
  fallback = null,
  requireAuth = true,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  if (!requireAuth && isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
}

/**
 * Guard component that requires specific permission
 */
export function PermissionGuard({
  children,
  permission,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RoleGuardProps {
  children: React.ReactNode;
  role?: string;
  roles?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

/**
 * Guard component that requires specific role(s)
 */
export function RoleGuard({
  children,
  role,
  roles,
  requireAll = false,
  fallback = null,
}: RoleGuardProps) {
  const {
    hasRole,
    hasAnyRole,
    isAuthenticated,
    isLoading,
    roles: userRoles,
  } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  let hasAccess = false;

  if (role) {
    hasAccess = hasRole(role);
  } else if (roles) {
    if (requireAll) {
      hasAccess = roles.every(r => hasRole(r));
    } else {
      hasAccess = hasAnyRole(roles);
    }
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireSuperAdmin?: boolean;
}

/**
 * Guard component that requires admin access
 */
export function AdminGuard({
  children,
  fallback = null,
  requireSuperAdmin = false,
}: AdminGuardProps) {
  const { hasRole, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  const isAdmin = hasRole("admin") || hasRole("super_admin");
  const isSuperAdmin = hasRole("super_admin");

  if (requireSuperAdmin && !isSuperAdmin) {
    return <>{fallback}</>;
  }

  if (!requireSuperAdmin && !isAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
