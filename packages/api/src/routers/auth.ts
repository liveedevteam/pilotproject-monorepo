import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
  createPermissionProcedure,
} from "../trpc";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  resetPasswordRequestSchema,
  resetPasswordConfirmSchema,
  updateProfileSchema,
  resendVerificationSchema,
} from "../schemas/auth";
import { auditHelpers } from "../utils/audit-logger";

export const authRouter = createTRPCRouter({
  /**
   * Register a new user
   */
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { email, password, firstName, lastName } = input;

        // Register user with Supabase
        const { data, error } = await ctx.supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName || null,
              last_name: lastName || null,
            },
          },
        });

        if (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        if (!data.user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "User registration failed",
          });
        }

        // Log registration event
        await auditHelpers.registration(
          data.user.id,
          email,
          undefined, // IP address would need to be extracted from headers
          undefined // User agent would need to be extracted from headers
        );

        return {
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
          },
          message:
            "Registration successful. Please check your email to verify your account.",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Registration failed",
        });
      }
    }),

  /**
   * Login user (note: actual token generation happens on client-side with Supabase)
   */
  login: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    try {
      const { email, password } = input;

      // Attempt to sign in with Supabase
      const { data, error } = await ctx.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Log failed login attempt
        await auditHelpers.loginFailed(email, error.message);

        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: error.message,
        });
      }

      if (!data.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Login failed",
        });
      }

      // Log successful login
      await auditHelpers.loginSuccess(data.user.id);

      // Update last login time
      await ctx.supabase
        .from("user_profiles")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", data.user.id);

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        session: data.session,
        message: "Login successful",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Login failed",
      });
    }
  }),

  /**
   * Logout user
   */
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const { error } = await ctx.supabase.auth.signOut();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      // Log logout event
      await auditHelpers.logout(ctx.user.id);

      return {
        success: true,
        message: "Logout successful",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Logout failed",
      });
    }
  }),

  /**
   * Get current user profile
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return {
      user: ctx.user,
      profile: ctx.user.profile,
      roles: ctx.user.roles || [],
      permissions: ctx.user.permissions || [],
    };
  }),

  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { firstName, lastName, phone, avatarUrl } = input;

        // Update user profile
        const { data, error } = await ctx.supabase
          .from("user_profiles")
          .update({
            first_name: firstName || null,
            last_name: lastName || null,
            phone: phone || null,
            avatar_url: avatarUrl || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", ctx.user.id)
          .select()
          .single();

        if (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        return {
          success: true,
          profile: {
            id: data.id,
            email: data.email,
            firstName: data.first_name,
            lastName: data.last_name,
            phone: data.phone,
            avatarUrl: data.avatar_url,
            isActive: data.is_active,
            emailVerified: data.email_verified,
            lastLoginAt: data.last_login_at
              ? new Date(data.last_login_at)
              : null,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
          },
          message: "Profile updated successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Profile update failed",
        });
      }
    }),

  /**
   * Change password
   */
  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { currentPassword, newPassword } = input;

        // Verify current password by attempting to sign in
        const { error: verifyError } =
          await ctx.supabase.auth.signInWithPassword({
            email: ctx.user.email!,
            password: currentPassword,
          });

        if (verifyError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Current password is incorrect",
          });
        }

        // Update password
        const { error } = await ctx.supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        // Log password change
        await auditHelpers.passwordChange(ctx.user.id);

        return {
          success: true,
          message: "Password changed successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Password change failed",
        });
      }
    }),

  /**
   * Request password reset
   */
  requestPasswordReset: publicProcedure
    .input(resetPasswordRequestSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { email } = input;

        const { error } = await ctx.supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
        });

        if (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        return {
          success: true,
          message: "Password reset email sent. Please check your inbox.",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Password reset request failed",
        });
      }
    }),

  /**
   * Resend email verification
   */
  resendVerification: publicProcedure
    .input(resendVerificationSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { email } = input;

        const { error } = await ctx.supabase.auth.resend({
          type: "signup",
          email,
        });

        if (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        return {
          success: true,
          message: "Verification email sent. Please check your inbox.",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Resend verification failed",
        });
      }
    }),

  /**
   * Check if user has specific permission
   */
  hasPermission: protectedProcedure
    .input(z.object({ permission: z.string() }))
    .query(async ({ input, ctx }) => {
      const hasPermission =
        ctx.user.permissions?.includes(input.permission) ?? false;

      return {
        hasPermission,
        permission: input.permission,
      };
    }),

  /**
   * Check if user has specific role
   */
  hasRole: protectedProcedure
    .input(z.object({ role: z.string() }))
    .query(async ({ input, ctx }) => {
      const hasRole = ctx.user.roles?.includes(input.role) ?? false;

      return {
        hasRole,
        role: input.role,
      };
    }),

  /**
   * Get user's effective permissions
   */
  getPermissions: protectedProcedure.query(async ({ ctx }) => {
    return {
      permissions: ctx.user.permissions || [],
      roles: ctx.user.roles || [],
    };
  }),

  /**
   * Refresh user session and data
   */
  refreshSession: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Refresh the session
      const { data, error } = await ctx.supabase.auth.refreshSession();

      if (error) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Session refresh failed",
        });
      }

      return {
        success: true,
        session: data.session,
        user: data.user,
        message: "Session refreshed successfully",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Session refresh failed",
      });
    }
  }),
});
