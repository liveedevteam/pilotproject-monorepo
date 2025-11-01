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

// Form components
export { FormInput } from "./FormInput";
export { PasswordInput } from "./PasswordInput";
export { LoginForm } from "./LoginForm";
export { RegisterForm } from "./RegisterForm";
export { AuthLayout } from "./AuthLayout";

// Email verification and password reset components
export { EmailVerification } from "./EmailVerification";
export { PasswordResetRequest } from "./PasswordResetRequest";
export { PasswordResetConfirm } from "./PasswordResetConfirm";

// Types
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

// Form component prop types
export type { FormInputProps } from "./FormInput";
export type { PasswordInputProps } from "./PasswordInput";
export type { LoginFormProps } from "./LoginForm";
export type { RegisterFormProps } from "./RegisterForm";
export type { AuthLayoutProps } from "./AuthLayout";
