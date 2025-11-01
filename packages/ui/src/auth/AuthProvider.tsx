"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
} from "react";
import { createBrowserSupabaseClient } from "@repo/database/browser";
import type {
  AuthContextType,
  AuthState,
  AuthAction,
  UserProfile,
  Role,
  AuthUser,
} from "./types";

const initialState: AuthState = {
  user: null,
  profile: null,
  roles: [],
  permissions: [],
  isLoading: true,
  isAuthenticated: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: action.payload !== null,
        isLoading: false,
      };
    case "SET_PROFILE":
      return { ...state, profile: action.payload };
    case "SET_ROLES":
      return { ...state, roles: action.payload };
    case "SET_PERMISSIONS":
      return { ...state, permissions: action.payload };
    case "SIGN_OUT":
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const supabase = createBrowserSupabaseClient();

  const fetchUserProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
          return null;
        }

        return {
          id: data.id,
          email: data.email,
          firstName: data.first_name,
          lastName: data.last_name,
          avatarUrl: data.avatar_url,
          phone: data.phone,
          isActive: data.is_active,
          emailVerified: data.email_verified,
          lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : null,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
      } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
    },
    [supabase]
  );

  const fetchUserRoles = useCallback(
    async (userId: string): Promise<Role[]> => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select(
            `
          *,
          role:roles (*)
        `
          )
          .eq("user_id", userId)
          .eq("is_active", true);

        if (error) {
          console.error("Error fetching user roles:", error);
          return [];
        }

        return data.map((userRole: any) => ({
          id: userRole.role.id,
          name: userRole.role.name,
          description: userRole.role.description,
          isSystem: userRole.role.is_system,
          isActive: userRole.role.is_active,
          createdAt: new Date(userRole.role.created_at),
          updatedAt: new Date(userRole.role.updated_at),
        }));
      } catch (error) {
        console.error("Error fetching user roles:", error);
        return [];
      }
    },
    [supabase]
  );

  const fetchUserPermissions = useCallback(
    async (userId: string): Promise<string[]> => {
      try {
        const { data, error } = await supabase.rpc("get_user_permissions", {
          user_id: userId,
        });

        if (error) {
          console.error("Error fetching user permissions:", error);
          return [];
        }

        return data.map((perm: any) => perm.permission_name);
      } catch (error) {
        console.error("Error fetching user permissions:", error);
        return [];
      }
    },
    [supabase]
  );

  const refreshUser = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const [profile, roles, permissions] = await Promise.all([
          fetchUserProfile(user.id),
          fetchUserRoles(user.id),
          fetchUserPermissions(user.id),
        ]);

        const authUser: AuthUser = {
          ...user,
          profile: profile || undefined,
          roles,
          permissions,
        };

        dispatch({ type: "SET_USER", payload: authUser });
        dispatch({ type: "SET_PROFILE", payload: profile });
        dispatch({ type: "SET_ROLES", payload: roles });
        dispatch({ type: "SET_PERMISSIONS", payload: permissions });
      } else {
        dispatch({ type: "SET_USER", payload: null });
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      dispatch({ type: "SET_USER", payload: null });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [supabase, fetchUserProfile, fetchUserRoles, fetchUserPermissions]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // User data will be updated via the auth state change listener
      } catch (error) {
        dispatch({ type: "SET_LOADING", payload: false });
        throw error;
      }
    },
    [supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string, metadata?: Record<string, any>) => {
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata,
          },
        });

        if (error) throw error;
      } catch (error) {
        dispatch({ type: "SET_LOADING", payload: false });
        throw error;
      }
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      dispatch({ type: "SIGN_OUT" });
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  }, [supabase]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!state.user) throw new Error("No authenticated user");

      try {
        const { error } = await supabase
          .from("user_profiles")
          .update({
            first_name: updates.firstName,
            last_name: updates.lastName,
            avatar_url: updates.avatarUrl,
            phone: updates.phone,
          })
          .eq("id", state.user.id);

        if (error) throw error;

        // Refresh user data
        await refreshUser();
      } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
      }
    },
    [supabase, state.user, refreshUser]
  );

  const hasPermission = useCallback(
    (permission: string): boolean => {
      return state.permissions.includes(permission);
    },
    [state.permissions]
  );

  const hasRole = useCallback(
    (roleName: string): boolean => {
      return state.roles.some(role => role.name === roleName);
    },
    [state.roles]
  );

  const hasAnyRole = useCallback(
    (roleNames: string[]): boolean => {
      return state.roles.some(role => roleNames.includes(role.name));
    },
    [state.roles]
  );

  // Set up auth state listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await refreshUser();
      } else if (event === "SIGNED_OUT") {
        dispatch({ type: "SIGN_OUT" });
      }
    });

    // Get initial user
    refreshUser();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, refreshUser]);

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    updateProfile,
    hasPermission,
    hasRole,
    hasAnyRole,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
