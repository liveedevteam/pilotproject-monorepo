import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface UserProfile {
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
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  conditions: Record<string, any> | null;
  createdAt: Date;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedBy: string | null;
  assignedAt: Date;
  expiresAt: Date | null;
  isActive: boolean;
  role?: Role;
}

export interface UserPermission {
  id: string;
  userId: string;
  permissionId: string;
  granted: boolean;
  assignedBy: string | null;
  assignedAt: Date;
  expiresAt: Date | null;
  reason: string | null;
  permission?: Permission;
}

export interface AuthUser extends SupabaseUser {
  profile?: UserProfile;
  roles?: Role[];
  permissions?: string[];
}

export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  roles: Role[];
  permissions: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, any>
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  refreshUser: () => Promise<void>;
}

export type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_USER"; payload: AuthUser | null }
  | { type: "SET_PROFILE"; payload: UserProfile | null }
  | { type: "SET_ROLES"; payload: Role[] }
  | { type: "SET_PERMISSIONS"; payload: string[] }
  | { type: "SIGN_OUT" };
