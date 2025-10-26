import { appRouter, createCallerFactory } from "@repo/api";

const createCaller = createCallerFactory(appRouter);

export const api = createCaller({
  headers: new Headers(),
});
