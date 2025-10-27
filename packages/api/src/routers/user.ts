import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { UserService } from "../services/user-service";

const userService = new UserService();

export const userRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    return await userService.getAllUsers();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      return await userService.getUserById(input.id);
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        email: z.string().email().max(255),
      })
    )
    .mutation(async ({ input }) => {
      return await userService.createUser(input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        name: z.string().min(1).max(255).optional(),
        email: z.string().email().max(255).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      return await userService.updateUser(id, updateData);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await userService.deleteUser(input.id);
      return { success: true };
    }),
});
