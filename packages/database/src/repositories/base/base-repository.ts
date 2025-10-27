import { eq, and, or, count, asc, desc } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { db } from "../../core/client";
import type {
  Database,
  PaginationOptions,
  QueryOptions,
} from "../../core/types";

export abstract class BaseRepository<T extends PgTable> {
  protected db: Database;
  protected table: T;

  constructor(table: T) {
    this.db = db;
    this.table = table;
  }

  async findById(id: string | number): Promise<any | null> {
    try {
      const result = await this.db
        .select()
        .from(this.table)
        .where(eq((this.table as any).id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error(`Error finding ${this.table._.name} by ID:`, error);
      throw error;
    }
  }

  async findAll(options: QueryOptions = {}): Promise<any[]> {
    try {
      return await this.db.select().from(this.table);
    } catch (error) {
      console.error(`Error finding all ${this.table._.name}:`, error);
      throw error;
    }
  }

  async create(data: any, options: QueryOptions = {}): Promise<any> {
    try {
      const result = await this.db.insert(this.table).values(data).returning();

      return result[0];
    } catch (error) {
      console.error(`Error creating ${this.table._.name}:`, error);
      throw error;
    }
  }

  async createMany(data: any[], options: QueryOptions = {}): Promise<any[]> {
    try {
      return await this.db.insert(this.table).values(data).returning();
    } catch (error) {
      console.error(`Error creating multiple ${this.table._.name}:`, error);
      throw error;
    }
  }

  async update(
    id: string | number,
    data: any,
    options: QueryOptions = {}
  ): Promise<any | null> {
    try {
      const result = await this.db
        .update(this.table)
        .set(data)
        .where(eq((this.table as any).id, id))
        .returning();

      return result[0] || null;
    } catch (error) {
      console.error(`Error updating ${this.table._.name}:`, error);
      throw error;
    }
  }

  async delete(
    id: string | number,
    options: QueryOptions = {}
  ): Promise<boolean> {
    try {
      const result = await this.db
        .delete(this.table)
        .where(eq((this.table as any).id, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting ${this.table._.name}:`, error);
      throw error;
    }
  }

  async softDelete(
    id: string | number,
    options: QueryOptions = {}
  ): Promise<boolean> {
    try {
      // Check if table has isActive field
      if ("isActive" in this.table) {
        const result = await this.db
          .update(this.table)
          .set({ isActive: false, deletedAt: new Date() } as any)
          .where(eq((this.table as any).id, id))
          .returning();

        return result.length > 0;
      } else {
        // Fall back to hard delete if no soft delete support
        return await this.delete(id, options);
      }
    } catch (error) {
      console.error(`Error soft deleting ${this.table._.name}:`, error);
      throw error;
    }
  }

  async exists(
    id: string | number,
    options: QueryOptions = {}
  ): Promise<boolean> {
    try {
      const result = await this.db
        .select({ id: (this.table as any).id })
        .from(this.table)
        .where(eq((this.table as any).id, id))
        .limit(1);

      return result.length > 0;
    } catch (error) {
      console.error(`Error checking if ${this.table._.name} exists:`, error);
      throw error;
    }
  }

  async count(whereClause?: any, options: QueryOptions = {}): Promise<number> {
    try {
      const query = this.db.select({ count: count() }).from(this.table);

      if (whereClause) {
        query.where(whereClause);
      }

      const result = await query;
      return result[0]?.count || 0;
    } catch (error) {
      console.error(`Error counting ${this.table._.name}:`, error);
      throw error;
    }
  }

  protected buildOrderBy(sortBy?: string, sortOrder: "asc" | "desc" = "asc") {
    if (!sortBy) {
      return undefined;
    }

    // For now, we'll use SQL strings for ordering to avoid type complexity
    return sortOrder === "asc" ? asc : desc;
  }

  protected buildPaginationQuery(pagination: PaginationOptions) {
    const offset = (pagination.page - 1) * pagination.limit;
    return {
      limit: pagination.limit,
      offset,
      orderBy: this.buildOrderBy(pagination.sortBy, pagination.sortOrder),
    };
  }
}
