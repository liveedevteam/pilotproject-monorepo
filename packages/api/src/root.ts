import { createTRPCRouter } from "./trpc";
import { userRouter } from "./routers/user";
import { authRouter } from "./routers/auth";
import { usersRouter } from "./routers/users";
import { auditRouter } from "./routers/audit";

export const appRouter = createTRPCRouter({
  user: userRouter,
  auth: authRouter,
  users: usersRouter,
  audit: auditRouter,
});

export type AppRouter = typeof appRouter;
