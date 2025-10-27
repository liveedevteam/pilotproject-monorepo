import { db, users } from "@repo/database";
import { eq, ilike, or, asc, desc, count } from "drizzle-orm";
import type { CreateUserInput, User, GetUsersInput } from "../types/user";
import type { PaginatedResult } from "../types/pagination";

export class UserRepository {
  async findPaginated(input: GetUsersInput): Promise<PaginatedResult<User>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "id",
      sortOrder = "asc",
    } = input;

    const offset = (page - 1) * limit;

    // Build where condition for search
    const whereCondition = search
      ? or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))
      : undefined;

    // Build order by condition
    const orderByCondition =
      sortOrder === "desc" ? desc(users[sortBy]) : asc(users[sortBy]);

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(users)
      .where(whereCondition);

    const total = totalResult[0]?.count || 0;

    // Get paginated data
    const data = await db
      .select()
      .from(users)
      .where(whereCondition)
      .orderBy(orderByCondition)
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
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
