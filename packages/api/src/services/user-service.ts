import { UserRepository } from "../repositories/user-repository";
import {
  UserNotFoundError,
  UserAlreadyExistsError,
  ValidationError,
} from "../errors/api-errors";
import type { CreateUserInput, User } from "../types/user";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async getUserById(id: number): Promise<User> {
    if (!id || id <= 0) {
      throw new ValidationError("Invalid user ID provided");
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }

    return user;
  }

  async createUser(userData: CreateUserInput): Promise<User> {
    if (!userData.name?.trim()) {
      throw new ValidationError("Name is required and cannot be empty");
    }

    if (!userData.email?.trim()) {
      throw new ValidationError("Email is required and cannot be empty");
    }

    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new UserAlreadyExistsError(userData.email);
    }

    return await this.userRepository.create({
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
    });
  }

  async updateUser(
    id: number,
    userData: Partial<CreateUserInput>
  ): Promise<User> {
    if (!id || id <= 0) {
      throw new ValidationError("Invalid user ID provided");
    }

    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new UserNotFoundError(id);
    }

    if (userData.email) {
      const userWithEmail = await this.userRepository.findByEmail(
        userData.email
      );
      if (userWithEmail && userWithEmail.id !== id) {
        throw new UserAlreadyExistsError(userData.email);
      }
    }

    const updateData: Partial<CreateUserInput> = {};
    if (userData.name?.trim()) {
      updateData.name = userData.name.trim();
    }
    if (userData.email?.trim()) {
      updateData.email = userData.email.trim().toLowerCase();
    }

    const updatedUser = await this.userRepository.update(id, updateData);
    if (!updatedUser) {
      throw new UserNotFoundError(id);
    }

    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    if (!id || id <= 0) {
      throw new ValidationError("Invalid user ID provided");
    }

    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new UserNotFoundError(id);
    }

    await this.userRepository.delete(id);
  }
}
