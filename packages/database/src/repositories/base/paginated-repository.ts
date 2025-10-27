import { PgTable } from "drizzle-orm/pg-core";
import { count } from "drizzle-orm";
import { BaseRepository } from "./base-repository";
import type {
  PaginationOptions,
  PaginatedResult,
  QueryOptions,
} from "../../core/types";

export abstract class PaginatedRepository<
  T extends PgTable,
> extends BaseRepository<T> {
  async findPaginated(
    pagination: PaginationOptions,
    whereClause?: any,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<any>> {
    try {
      const { limit, offset, orderBy } = this.buildPaginationQuery(pagination);

      // Execute query with raw SQL for simplicity
      let query = this.db.select().from(this.table);

      if (whereClause) {
        query = query.where(whereClause) as any;
      }

      const data = await query.limit(limit).offset(offset);
      const totalResult = await this.count(whereClause, options);

      const totalPages = Math.ceil(totalResult / pagination.limit);

      return {
        data,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: totalResult,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrevious: pagination.page > 1,
        },
      };
    } catch (error) {
      console.error(`Error finding paginated ${this.table._.name}:`, error);
      throw error;
    }
  }

  async findPaginatedWithSearch(
    pagination: PaginationOptions,
    searchFields: string[],
    searchTerm?: string,
    additionalWhere?: any,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<any>> {
    try {
      let whereClause = additionalWhere;

      // Add search condition if provided
      if (searchTerm && searchFields.length > 0) {
        const searchConditions = searchFields
          .filter(field => field in this.table)
          .map(field => {
            const column = this.table[field as keyof T];
            return `${column} ILIKE '%${searchTerm}%'`;
          });

        if (searchConditions.length > 0) {
          const searchClause = searchConditions.join(" OR ");
          whereClause = whereClause
            ? `(${whereClause}) AND (${searchClause})`
            : searchClause;
        }
      }

      return await this.findPaginated(pagination, whereClause, options);
    } catch (error) {
      console.error(
        `Error finding paginated ${this.table._.name} with search:`,
        error
      );
      throw error;
    }
  }

  async findActive(
    pagination?: PaginationOptions,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<any> | any[]> {
    try {
      // Check if table has isActive field
      if (!("isActive" in this.table)) {
        throw new Error(
          `Table ${this.table._.name} does not support soft delete/active filtering`
        );
      }

      const whereClause = { isActive: true };

      if (pagination) {
        return await this.findPaginated(pagination, whereClause, options);
      } else {
        return await this.db
          .select()
          .from(this.table)
          .where(whereClause as any);
      }
    } catch (error) {
      console.error(`Error finding active ${this.table._.name}:`, error);
      throw error;
    }
  }
}
