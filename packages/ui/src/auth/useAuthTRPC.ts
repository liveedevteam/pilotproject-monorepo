"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserSupabaseClient } from "@repo/database/browser";
import type { User, Session } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
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

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export const useAuthTRPC = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  const supabase = createBrowserSupabaseClient();

  // Function to build AuthUser from Supabase user and session
  const buildAuthUser = useCallback(
    async (user: User, session: Session): Promise<AuthUser | null> => {
      try {
        // For now, we'll create a basic AuthUser structure
        // In a real implementation, you might fetch additional profile data via tRPC
        const authUser: AuthUser = {
          id: user.id,
          email: user.email || "",
          profile: {
            id: user.id,
            email: user.email || "",
            firstName:
              user.user_metadata?.first_name ||
              user.user_metadata?.firstName ||
              null,
            lastName:
              user.user_metadata?.last_name ||
              user.user_metadata?.lastName ||
              null,
            avatarUrl: user.user_metadata?.avatar_url || null,
            phone: user.user_metadata?.phone || null,
            isActive: true,
            emailVerified: !!user.email_confirmed_at,
            lastLoginAt: user.last_sign_in_at
              ? new Date(user.last_sign_in_at)
              : null,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at || user.created_at),
          },
          // These would typically be fetched via tRPC calls
          roles: [],
          permissions: [],
        };

        return authUser;
      } catch (error) {
        console.error("Error building auth user:", error);
        return null;
      }
    },
    []
  );

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (session?.user) {
        const authUser = await buildAuthUser(session.user, session);
        setState({
          user: authUser,
          session,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        setState({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      setState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : "Authentication failed",
      });
    }
  }, [supabase, buildAuthUser]);

  // Sign in with email and password
  const signIn = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        if (data.user && data.session) {
          const authUser = await buildAuthUser(data.user, data.session);
          setState({
            user: authUser,
            session: data.session,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });

          // Handle remember me functionality
          if (rememberMe) {
            localStorage.setItem("supabase.auth.remember", "true");
          }

          return { user: authUser, session: data.session };
        }

        throw new Error("Sign in failed");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Sign in failed";
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [supabase, buildAuthUser]
  );

  // Sign up with email and password
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      options?: { firstName?: string; lastName?: string }
    ) => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: options?.firstName || null,
              last_name: options?.lastName || null,
            },
          },
        });

        if (error) {
          throw error;
        }

        // Note: User might not be immediately signed in if email confirmation is required
        if (data.user && data.session) {
          const authUser = await buildAuthUser(data.user, data.session);
          setState({
            user: authUser,
            session: data.session,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }

        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Sign up failed";
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [supabase, buildAuthUser]
  );

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // Clear local storage
      localStorage.removeItem("supabase.auth.remember");

      setState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Sign out failed";
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [supabase]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        throw error;
      }

      if (data.session?.user) {
        const authUser = await buildAuthUser(data.session.user, data.session);
        setState(prev => ({
          ...prev,
          user: authUser,
          session: data.session,
          error: null,
        }));
      }

      return data.session;
    } catch (error) {
      console.error("Session refresh error:", error);
      // Don't update error state for silent refresh failures
      return null;
    }
  }, [supabase, buildAuthUser]);

  // Permission checking utilities
  const hasPermission = useCallback(
    (permission: string): boolean => {
      return state.user?.permissions?.includes(permission) ?? false;
    },
    [state.user?.permissions]
  );

  const hasRole = useCallback(
    (role: string): boolean => {
      return state.user?.roles?.includes(role) ?? false;
    },
    [state.user?.roles]
  );

  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      return roles.some(role => hasRole(role));
    },
    [hasRole]
  );

  const isAdmin = useCallback((): boolean => {
    return hasAnyRole(["super_admin", "admin"]);
  }, [hasAnyRole]);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const authUser = await buildAuthUser(session.user, session);
        setState({
          user: authUser,
          session,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else if (event === "SIGNED_OUT") {
        setState({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        const authUser = await buildAuthUser(session.user, session);
        setState(prev => ({
          ...prev,
          user: authUser,
          session,
        }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, initializeAuth, buildAuthUser]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!state.session) return;

    const expiresAt = state.session.expires_at;
    if (!expiresAt) return;

    // Refresh 5 minutes before expiry
    const refreshTime = expiresAt * 1000 - Date.now() - 5 * 60 * 1000;

    if (refreshTime > 0) {
      const timer = setTimeout(refreshSession, refreshTime);
      return () => clearTimeout(timer);
    }
  }, [state.session, refreshSession]);

  return {
    // State
    ...state,

    // Actions
    signIn,
    signUp,
    signOut,
    refreshSession,

    // Utilities
    hasPermission,
    hasRole,
    hasAnyRole,
    isAdmin,

    // Raw Supabase client for direct access if needed
    supabase,
  };
};
