import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
  createPermissionProcedure,
} from "../trpc";
import { auditLogSchema } from "../schemas/auth";

// Permission-based procedures
const canViewAuditLogs = createPermissionProcedure("audit:read");

export const auditRouter = createTRPCRouter({
  /**
   * Get audit logs with pagination and filtering
   */
  getLogs: canViewAuditLogs
    .input(auditLogSchema)
    .query(async ({ input, ctx }) => {
      try {
        const { page, limit, userId, action, resource, startDate, endDate } =
          input;
        const offset = (page - 1) * limit;

        let query = ctx.supabase.from("auth_audit_log").select(
          `
            *,
            user:user_profiles(email, first_name, last_name)
          `,
          { count: "exact" }
        );

        // Apply filters
        if (userId) {
          query = query.eq("user_id", userId);
        }

        if (action) {
          query = query.eq("action", action);
        }

        if (resource) {
          query = query.eq("resource", resource);
        }

        if (startDate) {
          query = query.gte("created_at", startDate.toISOString());
        }

        if (endDate) {
          query = query.lte("created_at", endDate.toISOString());
        }

        // Apply sorting (most recent first)
        query = query.order("created_at", { ascending: false });

        // Apply pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }

        const logs =
          data?.map(log => ({
            id: log.id,
            userId: log.user_id,
            action: log.action,
            resource: log.resource,
            resourceId: log.resource_id,
            details: log.details,
            ipAddress: log.ip_address,
            userAgent: log.user_agent,
            createdAt: new Date(log.created_at),
            user: log.user
              ? {
                  email: log.user.email,
                  firstName: log.user.first_name,
                  lastName: log.user.last_name,
                }
              : null,
          })) || [];

        return {
          logs,
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch audit logs",
        });
      }
    }),

  /**
   * Get user's own audit logs
   */
  getMyLogs: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(10),
        action: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const { page, limit, action, startDate, endDate } = input;
        const offset = (page - 1) * limit;

        let query = ctx.supabase
          .from("auth_audit_log")
          .select("*", { count: "exact" })
          .eq("user_id", ctx.user.id);

        // Apply filters
        if (action) {
          query = query.eq("action", action);
        }

        if (startDate) {
          query = query.gte("created_at", startDate.toISOString());
        }

        if (endDate) {
          query = query.lte("created_at", endDate.toISOString());
        }

        // Apply sorting (most recent first)
        query = query.order("created_at", { ascending: false });

        // Apply pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }

        const logs =
          data?.map(log => ({
            id: log.id,
            action: log.action,
            resource: log.resource,
            resourceId: log.resource_id,
            details: log.details,
            ipAddress: log.ip_address,
            userAgent: log.user_agent,
            createdAt: new Date(log.created_at),
          })) || [];

        return {
          logs,
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch audit logs",
        });
      }
    }),

  /**
   * Get audit log statistics
   */
  getStats: canViewAuditLogs
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const { startDate, endDate } = input;

        let query = ctx.supabase
          .from("auth_audit_log")
          .select("action, created_at");

        if (startDate) {
          query = query.gte("created_at", startDate.toISOString());
        }

        if (endDate) {
          query = query.lte("created_at", endDate.toISOString());
        }

        const { data, error } = await query;

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }

        // Calculate statistics
        const actionCounts: Record<string, number> = {};
        const dailyCounts: Record<string, number> = {};

        data?.forEach(log => {
          // Count by action
          actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;

          // Count by day
          const date = new Date(log.created_at).toISOString().split("T")[0];
          dailyCounts[date] = (dailyCounts[date] || 0) + 1;
        });

        return {
          totalEvents: data?.length || 0,
          actionCounts,
          dailyCounts,
          period: {
            startDate,
            endDate,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch audit statistics",
        });
      }
    }),

  /**
   * Get unique audit log actions (for filtering)
   */
  getActions: canViewAuditLogs.query(async ({ ctx }) => {
    try {
      const { data, error } = await ctx.supabase
        .from("auth_audit_log")
        .select("action")
        .order("action");

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      const uniqueActions = [...new Set(data?.map(log => log.action))].filter(
        Boolean
      );

      return {
        actions: uniqueActions,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch audit actions",
      });
    }
  }),
});
