import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import {
  createAuthContext,
  enforceAuth,
  requirePermission,
  requireRole,
  requireAnyRole,
  requireAdmin,
  type AuthContext,
} from "./middleware/auth";

export const createTRPCContext = async (opts: {
  headers: Headers;
}): Promise<AuthContext> => {
  return await createAuthContext(opts);
};

const t = initTRPC.context<AuthContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

// Base procedures
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  const authCtx = enforceAuth(ctx);
  return next({ ctx: authCtx });
});

// Permission-based procedures
export const createPermissionProcedure = (permission: string) =>
  t.procedure.use(({ ctx, next }) => {
    const authCtx = requirePermission(permission)(ctx);
    return next({ ctx: authCtx });
  });

// Role-based procedures
export const createRoleProcedure = (role: string) =>
  t.procedure.use(({ ctx, next }) => {
    const authCtx = requireRole(role)(ctx);
    return next({ ctx: authCtx });
  });

export const createAnyRoleProcedure = (roles: string[]) =>
  t.procedure.use(({ ctx, next }) => {
    const authCtx = requireAnyRole(roles)(ctx);
    return next({ ctx: authCtx });
  });

// Admin procedure
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  const authCtx = requireAdmin(ctx);
  return next({ ctx: authCtx });
});

// Export middleware functions for custom usage
export {
  enforceAuth,
  requirePermission,
  requireRole,
  requireAnyRole,
  requireAdmin,
};
