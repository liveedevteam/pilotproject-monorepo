export interface CreateUserInput {
  name: string;
  email: string;
}

export interface GetUserByIdInput {
  id: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}
