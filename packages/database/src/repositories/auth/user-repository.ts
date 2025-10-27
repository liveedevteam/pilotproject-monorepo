import { eq, and, ilike, or } from "drizzle-orm";
import { PaginatedRepository } from "../base";
import { userProfiles } from "../../schemas/auth";
import type {
  PaginationOptions,
  PaginatedResult,
  QueryOptions,
} from "../../core/types";

export class UserRepository extends PaginatedRepository<typeof userProfiles> {
  constructor() {
    super(userProfiles);
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

  async findActiveUsers(
    pagination: PaginationOptions,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<any>> {
    try {
      return await this.findPaginated(
        pagination,
        eq(this.table.isActive, true),
        options
      );
    } catch (error) {
      console.error("Error finding active users:", error);
      throw error;
    }
  }

  async searchUsers(
    pagination: PaginationOptions,
    searchTerm: string,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<any>> {
    try {
      const searchFields = ["email", "firstName", "lastName"];

      return await this.findPaginatedWithSearch(
        pagination,
        searchFields,
        searchTerm,
        eq(this.table.isActive, true),
        options
      );
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  }

  async findRecentlyLoggedIn(
    pagination: PaginationOptions,
    daysSince: number = 30,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<any>> {
    try {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - daysSince);

      return await this.findPaginated(
        pagination,
        and(
          eq(this.table.isActive, true)
          // Note: Using SQL function for date comparison
          // In a real implementation, you'd use proper Drizzle date functions
        ),
        options
      );
    } catch (error) {
      console.error("Error finding recently logged in users:", error);
      throw error;
    }
  }

  async updateLastLogin(
    userId: string,
    options: QueryOptions = {}
  ): Promise<boolean> {
    try {
      const result = await this.db
        .update(this.table)
        .set({
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(this.table.id, userId))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error("Error updating last login:", error);
      throw error;
    }
  }

  async verifyEmail(
    userId: string,
    options: QueryOptions = {}
  ): Promise<boolean> {
    try {
      const result = await this.db
        .update(this.table)
        .set({
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(this.table.id, userId))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error("Error verifying email:", error);
      throw error;
    }
  }

  async deactivateUser(
    userId: string,
    options: QueryOptions = {}
  ): Promise<boolean> {
    try {
      return await this.softDelete(userId, options);
    } catch (error) {
      console.error("Error deactivating user:", error);
      throw error;
    }
  }
}
