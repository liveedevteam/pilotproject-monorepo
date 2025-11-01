import { z } from "zod";

// Validation helpers
const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .min(1, "Email is required");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    "Password must contain at least one special character"
  );

const nameSchema = z
  .string()
  .max(100, "Name must be less than 100 characters")
  .optional()
  .or(z.literal(""));

// Authentication input schemas
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
});

export const resetPasswordConfirmSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: passwordSchema,
});

export const updateProfileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: z
    .string()
    .max(20, "Phone number must be less than 20 characters")
    .optional()
    .or(z.literal("")),
  avatarUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
});

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

// User management schemas (for admin operations)
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  roles: z.array(z.string()).optional(),
  sendWelcomeEmail: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  id: z.string().uuid("Invalid user ID"),
  email: emailSchema.optional(),
  firstName: nameSchema,
  lastName: nameSchema,
  phone: z
    .string()
    .max(20, "Phone number must be less than 20 characters")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
});

export const assignRolesSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  roleIds: z.array(z.string().uuid("Invalid role ID")),
});

export const grantPermissionSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  permissionId: z.string().uuid("Invalid permission ID"),
  granted: z.boolean().default(true),
  reason: z.string().optional(),
  expiresAt: z.date().optional(),
});

// Pagination and filtering schemas
export const userListSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z
    .enum(["email", "firstName", "lastName", "createdAt", "lastLoginAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  role: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const auditLogSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordRequestInput = z.infer<
  typeof resetPasswordRequestSchema
>;
export type ResetPasswordConfirmInput = z.infer<
  typeof resetPasswordConfirmSchema
>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AssignRolesInput = z.infer<typeof assignRolesSchema>;
export type GrantPermissionInput = z.infer<typeof grantPermissionSchema>;
export type UserListInput = z.infer<typeof userListSchema>;
export type AuditLogInput = z.infer<typeof auditLogSchema>;
