import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { db, users } from "@repo/database";
import { eq } from "drizzle-orm";

export const userRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    return await db.select().from(users);
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.select().from(users).where(eq(users.id, input.id));
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      return await db.insert(users).values(input).returning();
    }),
});
