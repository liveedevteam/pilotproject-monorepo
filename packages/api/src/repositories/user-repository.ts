import { db, users } from "@repo/database";
import { eq } from "drizzle-orm";
import type { CreateUserInput, User } from "../types/user";

export class UserRepository {
  async findAll(): Promise<User[]> {
    return await db.select().from(users);
  }

  async findById(id: number): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0] || null;
  }

  async create(userData: CreateUserInput): Promise<User> {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }

  async update(
    id: number,
    userData: Partial<CreateUserInput>
  ): Promise<User | null> {
    const result = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }
}
