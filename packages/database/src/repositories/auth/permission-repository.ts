import { eq, and } from "drizzle-orm";
import { PaginatedRepository } from "../base";
import { permissions } from "../../schemas/auth";
import type {
  PaginationOptions,
  PaginatedResult,
  QueryOptions,
} from "../../core/types";

export class PermissionRepository extends PaginatedRepository<
  typeof permissions
> {
  constructor() {
    super(permissions);
  }

  async findByName(
    name: string,
    options: QueryOptions = {}
  ): Promise<any | null> {
    try {
      const result = await this.db
        .select()
        .from(this.table)
        .where(eq(this.table.name, name))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error("Error finding permission by name:", error);
      throw error;
    }
  }

  async findByResource(
    resource: string,
    pagination?: PaginationOptions,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<any> | any[]> {
    try {
      const whereClause = eq(this.table.resource, resource);

      if (pagination) {
        return await this.findPaginated(pagination, whereClause, options);
      } else {
        return await this.db.select().from(this.table).where(whereClause);
      }
    } catch (error) {
      console.error("Error finding permissions by resource:", error);
      throw error;
    }
  }

  async findByResourceAndAction(
    resource: string,
    action: string,
    options: QueryOptions = {}
  ): Promise<any | null> {
    try {
      const result = await this.db
        .select()
        .from(this.table)
        .where(
          and(eq(this.table.resource, resource), eq(this.table.action, action))
        )
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error("Error finding permission by resource and action:", error);
      throw error;
    }
  }

  async findPermissionsByAction(
    action: string,
    pagination?: PaginationOptions,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<any> | any[]> {
    try {
      const whereClause = eq(this.table.action, action);

      if (pagination) {
        return await this.findPaginated(pagination, whereClause, options);
      } else {
        return await this.db.select().from(this.table).where(whereClause);
      }
    } catch (error) {
      console.error("Error finding permissions by action:", error);
      throw error;
    }
  }

  async getUniqueResources(options: QueryOptions = {}): Promise<string[]> {
    try {
      const result = await this.db
        .selectDistinct({ resource: this.table.resource })
        .from(this.table);

      return result.map(r => r.resource);
    } catch (error) {
      console.error("Error getting unique resources:", error);
      throw error;
    }
  }

  async getUniqueActions(options: QueryOptions = {}): Promise<string[]> {
    try {
      const result = await this.db
        .selectDistinct({ action: this.table.action })
        .from(this.table);

      return result.map(a => a.action);
    } catch (error) {
      console.error("Error getting unique actions:", error);
      throw error;
    }
  }
}
