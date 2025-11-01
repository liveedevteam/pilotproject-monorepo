import { appRouter, createCallerFactory, createTRPCContext } from "@repo/api";

const createCaller = createCallerFactory(appRouter);

export const api = createCaller(() =>
  createTRPCContext({
    headers: new Headers(),
  })
);
