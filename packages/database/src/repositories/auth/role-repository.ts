import { eq, and } from "drizzle-orm";
import { PaginatedRepository } from "../base";
import { roles } from "../../schemas/auth";
import type {
  PaginationOptions,
  PaginatedResult,
  QueryOptions,
} from "../../core/types";

export class RoleRepository extends PaginatedRepository<typeof roles> {
  constructor() {
    super(roles);
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
      console.error("Error finding role by name:", error);
      throw error;
    }
  }

  async findSystemRoles(
    pagination?: PaginationOptions,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<any> | any[]> {
    try {
      const whereClause = and(
        eq(this.table.isSystem, true),
        eq(this.table.isActive, true)
      );

      if (pagination) {
        return await this.findPaginated(pagination, whereClause, options);
      } else {
        return await this.db.select().from(this.table).where(whereClause);
      }
    } catch (error) {
      console.error("Error finding system roles:", error);
      throw error;
    }
  }

  async findUserRoles(
    pagination?: PaginationOptions,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<any> | any[]> {
    try {
      const whereClause = and(
        eq(this.table.isSystem, false),
        eq(this.table.isActive, true)
      );

      if (pagination) {
        return await this.findPaginated(pagination, whereClause, options);
      } else {
        return await this.db.select().from(this.table).where(whereClause);
      }
    } catch (error) {
      console.error("Error finding user roles:", error);
      throw error;
    }
  }

  async createUserRole(data: any, options: QueryOptions = {}): Promise<any> {
    try {
      // Ensure user roles are not marked as system roles
      const roleData = {
        ...data,
        isSystem: false,
      };

      return await this.create(roleData, options);
    } catch (error) {
      console.error("Error creating user role:", error);
      throw error;
    }
  }

  async deleteRole(id: string, options: QueryOptions = {}): Promise<boolean> {
    try {
      // Check if it's a system role
      const role = await this.findById(id);

      if (role?.isSystem) {
        throw new Error("Cannot delete system roles");
      }

      return await this.softDelete(id, options);
    } catch (error) {
      console.error("Error deleting role:", error);
      throw error;
    }
  }
}
