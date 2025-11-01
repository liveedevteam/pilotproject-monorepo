import { createTRPCRouter } from "./trpc";
import { userRouter } from "./routers/user";
import { authRouter } from "./routers/auth";
import { usersRouter } from "./routers/users";
import { auditRouter } from "./routers/audit";
import { rolesRouter } from "./routers/roles";
import { permissionsRouter } from "./routers/permissions";

export const appRouter = createTRPCRouter({
  user: userRouter,
  auth: authRouter,
  users: usersRouter,
  audit: auditRouter,
  roles: rolesRouter,
  permissions: permissionsRouter,
});

export type AppRouter = typeof appRouter;
