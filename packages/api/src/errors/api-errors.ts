import { TRPCError } from "@trpc/server";

export class UserNotFoundError extends TRPCError {
  constructor(id: number) {
    super({
      code: "NOT_FOUND",
      message: `User with id ${id} not found`,
    });
  }
}

export class UserAlreadyExistsError extends TRPCError {
  constructor(email: string) {
    super({
      code: "CONFLICT",
      message: `User with email ${email} already exists`,
    });
  }
}

export class ValidationError extends TRPCError {
  constructor(message: string) {
    super({
      code: "BAD_REQUEST",
      message,
    });
  }
}
