import { useAuth } from "./AuthProvider";
import { useCallback } from "react";

/**
 * Hook for permission-based access control
 */
export function usePermission(permission: string) {
  const { hasPermission } = useAuth();

  return {
    hasPermission: hasPermission(permission),
    checkPermission: useCallback(
      () => hasPermission(permission),
      [hasPermission, permission]
    ),
  };
}

/**
 * Hook for role-based access control
 */
export function useRole(role: string) {
  const { hasRole } = useAuth();

  return {
    hasRole: hasRole(role),
    checkRole: useCallback(() => hasRole(role), [hasRole, role]),
  };
}

/**
 * Hook for multiple role checking
 */
export function useRoles(roles: string[]) {
  const { hasAnyRole } = useAuth();

  return {
    hasAnyRole: hasAnyRole(roles),
    checkAnyRole: useCallback(() => hasAnyRole(roles), [hasAnyRole, roles]),
  };
}

/**
 * Hook for admin access (convenience hook)
 */
export function useAdmin() {
  const { hasRole } = useAuth();

  return {
    isAdmin: hasRole("admin") || hasRole("super_admin"),
    isSuperAdmin: hasRole("super_admin"),
  };
}

/**
 * Hook for authentication status
 */
export function useAuthStatus() {
  const { isAuthenticated, isLoading, user } = useAuth();

  return {
    isAuthenticated,
    isLoading,
    isGuest: !isAuthenticated && !isLoading,
    userId: user?.id,
  };
}
