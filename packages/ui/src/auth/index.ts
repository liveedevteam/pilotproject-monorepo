// Main exports for the auth module
export { AuthProvider, useAuth } from "./AuthProvider";
export {
  usePermission,
  useRole,
  useRoles,
  useAdmin,
  useAuthStatus,
} from "./hooks";
export { AuthGuard, PermissionGuard, RoleGuard, AdminGuard } from "./guards";
export type {
  UserProfile,
  Role,
  Permission,
  UserRole,
  UserPermission,
  AuthUser,
  AuthState,
  AuthContextType,
  AuthAction,
} from "./types";
