export interface CreateUserInput {
  name: string;
  email: string;
}

export interface GetUserByIdInput {
  id: number;
}

export interface GetUsersInput {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "id" | "name" | "email" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}
