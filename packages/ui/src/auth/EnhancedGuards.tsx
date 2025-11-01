"use client";

import React from "react";
import { useAuth } from "./EnhancedAuthProvider";

// Loading component for auth checks
interface AuthLoadingProps {
  className?: string;
  message?: string;
}

const AuthLoading: React.FC<AuthLoadingProps> = ({
  className = "",
  message = "Checking authentication...",
}) => (
  <div className={`flex items-center justify-center p-8 ${className}`}>
    <div className="text-center">
      <div className="w-8 h-8 mx-auto border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

// Unauthorized fallback component
interface UnauthorizedFallbackProps {
  message?: string;
  showLoginButton?: boolean;
  onLoginClick?: () => void;
  className?: string;
}

const UnauthorizedFallback: React.FC<UnauthorizedFallbackProps> = ({
  message = "You don't have permission to access this content.",
  showLoginButton = false,
  onLoginClick,
  className = "",
}) => (
  <div className={`flex items-center justify-center p-8 ${className}`}>
    <div className="text-center max-w-md">
      <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Access Denied
      </h3>
      <p className="text-gray-600 mb-4">{message}</p>
      {showLoginButton && (
        <button
          onClick={onLoginClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Sign In
        </button>
      )}
    </div>
  </div>
);

// Enhanced Auth Guard
interface EnhancedAuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  className?: string;
}

export const EnhancedAuthGuard: React.FC<EnhancedAuthGuardProps> = ({
  children,
  fallback,
  loadingComponent,
  requireAuth = true,
  redirectTo,
  className = "",
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return loadingComponent || <AuthLoading className={className} />;
  }

  // Handle authentication requirement
  if (requireAuth && !isAuthenticated) {
    if (redirectTo && typeof window !== "undefined") {
      window.location.href = redirectTo;
      return <AuthLoading message="Redirecting..." className={className} />;
    }

    return (
      fallback || (
        <UnauthorizedFallback
          message="Please sign in to access this content."
          showLoginButton={true}
          onLoginClick={() => redirectTo && (window.location.href = redirectTo)}
          className={className}
        />
      )
    );
  }

  // Handle "guest only" requirement
  if (!requireAuth && isAuthenticated) {
    return fallback || null;
  }

  return <>{children}</>;
};

// Permission Guard
interface PermissionGuardProps {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  requireAuth?: boolean;
  className?: string;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  fallback,
  loadingComponent,
  requireAuth = true,
  className = "",
}) => {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();

  // Show loading state
  if (isLoading) {
    return loadingComponent || <AuthLoading className={className} />;
  }

  // Check authentication first if required
  if (requireAuth && !isAuthenticated) {
    return (
      fallback || (
        <UnauthorizedFallback
          message="Please sign in to access this content."
          showLoginButton={true}
          className={className}
        />
      )
    );
  }

  // Check permission
  if (isAuthenticated && !hasPermission(permission)) {
    return (
      fallback || (
        <UnauthorizedFallback
          message={`You need the "${permission}" permission to access this content.`}
          className={className}
        />
      )
    );
  }

  return <>{children}</>;
};

// Role Guard
interface RoleGuardProps {
  children: React.ReactNode;
  role?: string;
  roles?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  requireAuth?: boolean;
  className?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  role,
  roles = [],
  requireAll = false,
  fallback,
  loadingComponent,
  requireAuth = true,
  className = "",
}) => {
  const { isAuthenticated, isLoading, hasRole, hasAnyRole } = useAuth();

  // Normalize roles array
  const rolesToCheck = role ? [role] : roles;

  // Show loading state
  if (isLoading) {
    return loadingComponent || <AuthLoading className={className} />;
  }

  // Check authentication first if required
  if (requireAuth && !isAuthenticated) {
    return (
      fallback || (
        <UnauthorizedFallback
          message="Please sign in to access this content."
          showLoginButton={true}
          className={className}
        />
      )
    );
  }

  // Check roles
  if (isAuthenticated && rolesToCheck.length > 0) {
    const hasRequiredRoles = requireAll
      ? rolesToCheck.every(r => hasRole(r))
      : hasAnyRole(rolesToCheck);

    if (!hasRequiredRoles) {
      const roleText =
        rolesToCheck.length === 1
          ? `"${rolesToCheck[0]}" role`
          : requireAll
            ? `all of these roles: ${rolesToCheck.join(", ")}`
            : `one of these roles: ${rolesToCheck.join(", ")}`;

      return (
        fallback || (
          <UnauthorizedFallback
            message={`You need ${roleText} to access this content.`}
            className={className}
          />
        )
      );
    }
  }

  return <>{children}</>;
};

// Admin Guard (convenience component)
interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  className?: string;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({
  children,
  fallback,
  loadingComponent,
  className = "",
}) => {
  return (
    <RoleGuard
      roles={["super_admin", "admin"]}
      fallback={fallback}
      loadingComponent={loadingComponent}
      className={className}
    >
      {children}
    </RoleGuard>
  );
};

// Route Guard (combines multiple checks)
interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  permissions?: string[];
  roles?: string[];
  requireAllPermissions?: boolean;
  requireAllRoles?: boolean;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  redirectTo?: string;
  className?: string;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requireAuth = true,
  permissions = [],
  roles = [],
  requireAllPermissions = false,
  requireAllRoles = false,
  fallback,
  loadingComponent,
  redirectTo,
  className = "",
}) => {
  const { isAuthenticated, isLoading, hasPermission, hasRole, hasAnyRole } =
    useAuth();

  // Show loading state
  if (isLoading) {
    return loadingComponent || <AuthLoading className={className} />;
  }

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    if (redirectTo && typeof window !== "undefined") {
      window.location.href = redirectTo;
      return <AuthLoading message="Redirecting..." className={className} />;
    }

    return (
      fallback || (
        <UnauthorizedFallback
          message="Please sign in to access this content."
          showLoginButton={true}
          onLoginClick={() => redirectTo && (window.location.href = redirectTo)}
          className={className}
        />
      )
    );
  }

  // Check permissions
  if (isAuthenticated && permissions.length > 0) {
    const hasRequiredPermissions = requireAllPermissions
      ? permissions.every(p => hasPermission(p))
      : permissions.some(p => hasPermission(p));

    if (!hasRequiredPermissions) {
      return (
        fallback || (
          <UnauthorizedFallback
            message="You don't have the required permissions to access this content."
            className={className}
          />
        )
      );
    }
  }

  // Check roles
  if (isAuthenticated && roles.length > 0) {
    const hasRequiredRoles = requireAllRoles
      ? roles.every(r => hasRole(r))
      : hasAnyRole(roles);

    if (!hasRequiredRoles) {
      return (
        fallback || (
          <UnauthorizedFallback
            message="You don't have the required role to access this content."
            className={className}
          />
        )
      );
    }
  }

  return <>{children}</>;
};

// Export components and utilities
export { AuthLoading, UnauthorizedFallback };

// Legacy guard for backward compatibility
export const AuthGuard = EnhancedAuthGuard;
