import { createServerSupabaseClient } from "@repo/database";

export interface AuditLogEntry {
  userId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Logs authentication and authorization events to the audit log
 */
export const logAuthEvent = async (entry: AuditLogEntry): Promise<void> => {
  try {
    const supabase = createServerSupabaseClient();

    const { error } = await supabase.from("auth_audit_log").insert({
      user_id: entry.userId,
      action: entry.action,
      resource: entry.resource,
      resource_id: entry.resourceId,
      details: entry.details,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to log audit event:", error);
    }
  } catch (error) {
    console.error("Audit logging error:", error);
  }
};

/**
 * Authentication event types for consistent logging
 */
export const AUTH_EVENTS = {
  // Authentication events
  USER_LOGIN_SUCCESS: "user_login_success",
  USER_LOGIN_FAILED: "user_login_failed",
  USER_LOGOUT: "user_logout",
  USER_REGISTRATION: "user_registration",
  PASSWORD_CHANGE: "password_change",
  PASSWORD_RESET_REQUEST: "password_reset_request",
  EMAIL_VERIFICATION: "email_verification",

  // Authorization events
  PERMISSION_CHECK_SUCCESS: "permission_check_success",
  PERMISSION_CHECK_FAILED: "permission_check_failed",
  ROLE_ASSIGNED: "role_assigned",
  ROLE_REMOVED: "role_removed",
  PERMISSION_GRANTED: "permission_granted",
  PERMISSION_REVOKED: "permission_revoked",

  // Administrative events
  USER_CREATED_BY_ADMIN: "user_created_by_admin",
  USER_MODIFIED_BY_ADMIN: "user_modified_by_admin",
  USER_DEACTIVATED: "user_deactivated",
  ROLE_CREATED: "role_created",
  ROLE_MODIFIED: "role_modified",
  BULK_OPERATION_PERFORMED: "bulk_operation_performed",
} as const;

/**
 * Helper functions for common audit log scenarios
 */
export const auditHelpers = {
  /**
   * Log successful login
   */
  loginSuccess: (userId: string, ipAddress?: string, userAgent?: string) =>
    logAuthEvent({
      userId,
      action: AUTH_EVENTS.USER_LOGIN_SUCCESS,
      resource: "authentication",
      ipAddress,
      userAgent,
    }),

  /**
   * Log failed login attempt
   */
  loginFailed: (
    email: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ) =>
    logAuthEvent({
      userId: "anonymous",
      action: AUTH_EVENTS.USER_LOGIN_FAILED,
      resource: "authentication",
      details: { email, reason },
      ipAddress,
      userAgent,
    }),

  /**
   * Log user logout
   */
  logout: (userId: string, ipAddress?: string, userAgent?: string) =>
    logAuthEvent({
      userId,
      action: AUTH_EVENTS.USER_LOGOUT,
      resource: "authentication",
      ipAddress,
      userAgent,
    }),

  /**
   * Log user registration
   */
  registration: (
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string
  ) =>
    logAuthEvent({
      userId,
      action: AUTH_EVENTS.USER_REGISTRATION,
      resource: "authentication",
      details: { email },
      ipAddress,
      userAgent,
    }),

  /**
   * Log password change
   */
  passwordChange: (userId: string, ipAddress?: string, userAgent?: string) =>
    logAuthEvent({
      userId,
      action: AUTH_EVENTS.PASSWORD_CHANGE,
      resource: "authentication",
      ipAddress,
      userAgent,
    }),

  /**
   * Log permission check failure
   */
  permissionDenied: (
    userId: string,
    permission: string,
    resource?: string,
    ipAddress?: string,
    userAgent?: string
  ) =>
    logAuthEvent({
      userId,
      action: AUTH_EVENTS.PERMISSION_CHECK_FAILED,
      resource: resource || "api",
      details: { required_permission: permission },
      ipAddress,
      userAgent,
    }),

  /**
   * Log role assignment
   */
  roleAssigned: (
    userId: string,
    assignedRole: string,
    assignedBy: string,
    ipAddress?: string,
    userAgent?: string
  ) =>
    logAuthEvent({
      userId,
      action: AUTH_EVENTS.ROLE_ASSIGNED,
      resource: "user_management",
      details: { assigned_role: assignedRole, assigned_by: assignedBy },
      ipAddress,
      userAgent,
    }),

  /**
   * Log administrative user modification
   */
  userModifiedByAdmin: (
    targetUserId: string,
    adminUserId: string,
    changes: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ) =>
    logAuthEvent({
      userId: adminUserId,
      action: AUTH_EVENTS.USER_MODIFIED_BY_ADMIN,
      resource: "user_management",
      resourceId: targetUserId,
      details: { changes },
      ipAddress,
      userAgent,
    }),
};
