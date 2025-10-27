import { eq, ilike } from "drizzle-orm";
import { PaginatedRepository } from "../base";
import { users } from "../../schemas/users";
import type {
  PaginationOptions,
  PaginatedResult,
  QueryOptions,
} from "../../core/types";

export class UsersRepository extends PaginatedRepository<typeof users> {
  constructor() {
    super(users);
  }

  async findByEmail(
    email: string,
    options: QueryOptions = {}
  ): Promise<any | null> {
    try {
      const result = await this.db
        .select()
        .from(this.table)
        .where(eq(this.table.email, email))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error("Error finding user by email:", error);
      throw error;
    }
  }

  async searchByName(
    searchTerm: string,
    pagination: PaginationOptions,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<any>> {
    try {
      const whereClause = ilike(this.table.name, `%${searchTerm}%`);

      return await this.findPaginated(pagination, whereClause, options);
    } catch (error) {
      console.error("Error searching users by name:", error);
      throw error;
    }
  }

  async findRecent(
    limit: number = 10,
    options: QueryOptions = {}
  ): Promise<any[]> {
    try {
      return await this.db
        .select()
        .from(this.table)
        .orderBy(this.table.createdAt)
        .limit(limit);
    } catch (error) {
      console.error("Error finding recent users:", error);
      throw error;
    }
  }
}
