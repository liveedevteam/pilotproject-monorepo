import { z } from "zod";

// Common validation schemas
export const commonSchemas = {
  uuid: z.string().uuid("Invalid UUID format"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  url: z.string().url("Invalid URL format"),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
};

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().int().min(1, "Page must be at least 1").default(1),
  limit: z
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must be at most 100")
    .default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// User validation schemas
export const userSchemas = {
  create: z.object({
    email: commonSchemas.email,
    firstName: commonSchemas.name.optional(),
    lastName: commonSchemas.name.optional(),
    phone: commonSchemas.phone.optional(),
    avatarUrl: commonSchemas.url.optional(),
  }),

  update: z.object({
    firstName: commonSchemas.name.optional(),
    lastName: commonSchemas.name.optional(),
    phone: commonSchemas.phone.optional(),
    avatarUrl: commonSchemas.url.optional(),
  }),

  search: z.object({
    searchTerm: z.string().min(2, "Search term must be at least 2 characters"),
    ...paginationSchema.shape,
  }),
};

// Role validation schemas
export const roleSchemas = {
  create: z.object({
    name: z
      .string()
      .min(1, "Role name is required")
      .max(50, "Role name must be less than 50 characters"),
    description: commonSchemas.description,
  }),

  update: z.object({
    name: z
      .string()
      .min(1, "Role name is required")
      .max(50, "Role name must be less than 50 characters")
      .optional(),
    description: commonSchemas.description,
    isActive: z.boolean().optional(),
  }),
};

// Permission validation schemas
export const permissionSchemas = {
  create: z.object({
    name: z
      .string()
      .min(1, "Permission name is required")
      .max(100, "Permission name must be less than 100 characters"),
    description: commonSchemas.description,
    resource: z
      .string()
      .min(1, "Resource is required")
      .max(50, "Resource must be less than 50 characters"),
    action: z
      .string()
      .min(1, "Action is required")
      .max(50, "Action must be less than 50 characters"),
    conditions: z.record(z.any()).optional(),
  }),

  update: z.object({
    name: z
      .string()
      .min(1, "Permission name is required")
      .max(100, "Permission name must be less than 100 characters")
      .optional(),
    description: commonSchemas.description,
    resource: z
      .string()
      .min(1, "Resource is required")
      .max(50, "Resource must be less than 50 characters")
      .optional(),
    action: z
      .string()
      .min(1, "Action is required")
      .max(50, "Action must be less than 50 characters")
      .optional(),
    conditions: z.record(z.any()).optional(),
  }),
};

// Role assignment validation
export const roleAssignmentSchema = z.object({
  userId: commonSchemas.uuid,
  roleId: commonSchemas.uuid,
  expiresAt: z.date().optional(),
});

// Validation helper functions
export const validationHelpers = {
  /**
   * Validate data against a schema and throw detailed error
   */
  validateOrThrow: <T>(schema: z.ZodSchema<T>, data: unknown): T => {
    const result = schema.safeParse(data);

    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        field: err.path.join("."),
        message: err.message,
      }));

      throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
    }

    return result.data;
  },

  /**
   * Validate data and return result with errors
   */
  validate: <T>(schema: z.ZodSchema<T>, data: unknown) => {
    const result = schema.safeParse(data);

    if (!result.success) {
      return {
        success: false,
        errors: result.error.errors.map(err => ({
          field: err.path.join("."),
          message: err.message,
        })),
        data: null,
      };
    }

    return {
      success: true,
      errors: [],
      data: result.data,
    };
  },

  /**
   * Sanitize string input
   */
  sanitizeString: (input: string): string => {
    return input.trim().replace(/\s+/g, " ");
  },

  /**
   * Validate and sanitize email
   */
  sanitizeEmail: (email: string): string => {
    return email.toLowerCase().trim();
  },

  /**
   * Check if string is valid UUID
   */
  isValidUUID: (uuid: string): boolean => {
    return commonSchemas.uuid.safeParse(uuid).success;
  },

  /**
   * Check if pagination parameters are valid
   */
  validatePagination: (page: number, limit: number) => {
    return paginationSchema.safeParse({ page, limit });
  },
};
