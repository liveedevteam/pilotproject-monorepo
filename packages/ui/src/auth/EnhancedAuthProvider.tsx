"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuthTRPC, type AuthUser, type AuthState } from "./useAuthTRPC";

interface EnhancedAuthContextType extends AuthState {
  // Actions
  signIn: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<any>;
  signUp: (
    email: string,
    password: string,
    options?: { firstName?: string; lastName?: string }
  ) => Promise<any>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<any>;
  updateProfile: (data: Partial<AuthUser["profile"]>) => Promise<void>;

  // Permission utilities
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isAdmin: () => boolean;

  // Loading states for specific operations
  isSigningIn: boolean;
  isSigningUp: boolean;
  isSigningOut: boolean;
  isUpdatingProfile: boolean;
}

const EnhancedAuthContext = createContext<EnhancedAuthContextType | undefined>(
  undefined
);

interface EnhancedAuthProviderProps {
  children: React.ReactNode;
  // Optional custom tRPC client for server-side rendering
  trpcClient?: any;
}

export const EnhancedAuthProvider: React.FC<EnhancedAuthProviderProps> = ({
  children,
  trpcClient,
}) => {
  const auth = useAuthTRPC();

  // Additional loading states for specific operations
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Enhanced user data with permissions and roles fetched via tRPC
  const [enhancedUser, setEnhancedUser] = useState<AuthUser | null>(null);

  // Function to fetch user permissions and roles via tRPC
  const fetchUserEnhancements = useCallback(
    async (userId: string) => {
      if (!trpcClient) return;

      try {
        // These would be actual tRPC calls in a real implementation
        // const profile = await trpcClient.auth.getProfile.query();
        // const permissions = await trpcClient.permissions.getUserPermissions.query();

        // For now, we'll simulate this data
        // In a real implementation, you'd make the actual tRPC calls here

        return {
          roles: ["user"], // This would come from tRPC
          permissions: ["profile:read", "profile:update"], // This would come from tRPC
        };
      } catch (error) {
        console.error("Error fetching user enhancements:", error);
        return null;
      }
    },
    [trpcClient]
  );

  // Update enhanced user when base user changes
  useEffect(() => {
    if (auth.user) {
      setEnhancedUser(auth.user);

      // Fetch additional user data via tRPC
      if (trpcClient) {
        fetchUserEnhancements(auth.user.id).then(enhancements => {
          if (enhancements) {
            setEnhancedUser(prev =>
              prev
                ? {
                    ...prev,
                    roles: enhancements.roles,
                    permissions: enhancements.permissions,
                  }
                : null
            );
          }
        });
      }
    } else {
      setEnhancedUser(null);
    }
  }, [auth.user, fetchUserEnhancements, trpcClient]);

  // Enhanced sign in with loading state
  const signIn = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      setIsSigningIn(true);
      try {
        return await auth.signIn(email, password, rememberMe);
      } finally {
        setIsSigningIn(false);
      }
    },
    [auth]
  );

  // Enhanced sign up with loading state
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      options?: { firstName?: string; lastName?: string }
    ) => {
      setIsSigningUp(true);
      try {
        return await auth.signUp(email, password, options);
      } finally {
        setIsSigningUp(false);
      }
    },
    [auth]
  );

  // Enhanced sign out with loading state
  const signOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await auth.signOut();
    } finally {
      setIsSigningOut(false);
    }
  }, [auth]);

  // Profile update function (would use tRPC in real implementation)
  const updateProfile = useCallback(
    async (data: Partial<AuthUser["profile"]>) => {
      if (!enhancedUser || !trpcClient) return;

      setIsUpdatingProfile(true);
      try {
        // This would be an actual tRPC call
        // await trpcClient.auth.updateProfile.mutate(data);

        // Update local state optimistically
        setEnhancedUser(prev =>
          prev
            ? {
                ...prev,
                profile: prev.profile
                  ? { ...prev.profile, ...data }
                  : undefined,
              }
            : null
        );
      } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
      } finally {
        setIsUpdatingProfile(false);
      }
    },
    [enhancedUser, trpcClient]
  );

  // Permission utilities using enhanced user data
  const hasPermission = useCallback(
    (permission: string): boolean => {
      return enhancedUser?.permissions?.includes(permission) ?? false;
    },
    [enhancedUser?.permissions]
  );

  const hasRole = useCallback(
    (role: string): boolean => {
      return enhancedUser?.roles?.includes(role) ?? false;
    },
    [enhancedUser?.roles]
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

  const contextValue: EnhancedAuthContextType = {
    // State from base auth
    user: enhancedUser,
    session: auth.session,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    error: auth.error,

    // Enhanced actions
    signIn,
    signUp,
    signOut,
    refreshSession: auth.refreshSession,
    updateProfile,

    // Permission utilities
    hasPermission,
    hasRole,
    hasAnyRole,
    isAdmin,

    // Loading states
    isSigningIn,
    isSigningUp,
    isSigningOut,
    isUpdatingProfile,
  };

  return (
    <EnhancedAuthContext.Provider value={contextValue}>
      {children}
    </EnhancedAuthContext.Provider>
  );
};

export const useAuth = (): EnhancedAuthContextType => {
  const context = useContext(EnhancedAuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an EnhancedAuthProvider");
  }
  return context;
};

// Convenience hooks for specific use cases
export const useUser = () => {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
};

export const usePermissions = () => {
  const { user, hasPermission, hasRole, hasAnyRole, isAdmin } = useAuth();
  return {
    permissions: user?.permissions || [],
    roles: user?.roles || [],
    hasPermission,
    hasRole,
    hasAnyRole,
    isAdmin,
  };
};

export const useAuthStatus = () => {
  const { isAuthenticated, isLoading, error } = useAuth();
  return { isAuthenticated, isLoading, error };
};

// Export the context for direct access if needed
export { EnhancedAuthContext };
