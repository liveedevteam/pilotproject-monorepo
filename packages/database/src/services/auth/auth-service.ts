import {
  UserRepository,
  RoleRepository,
  PermissionRepository,
} from "../../repositories/auth";
import { rawClient } from "../../core/client";
import type {
  PaginationOptions,
  PaginatedResult,
  QueryOptions,
} from "../../core/types";

export class AuthService {
  private userRepo: UserRepository;
  private roleRepo: RoleRepository;
  private permissionRepo: PermissionRepository;

  constructor() {
    this.userRepo = new UserRepository();
    this.roleRepo = new RoleRepository();
    this.permissionRepo = new PermissionRepository();
  }

  // User management methods
  async getUserById(id: string) {
    return await this.userRepo.findById(id);
  }

  async getUserByEmail(email: string, options?: QueryOptions) {
    return await this.userRepo.findByEmail(email, options);
  }

  async getUsersPaginated(
    pagination: PaginationOptions,
    searchTerm?: string,
    options?: QueryOptions
  ) {
    if (searchTerm) {
      return await this.userRepo.searchUsers(pagination, searchTerm, options);
    }
    return await this.userRepo.findActiveUsers(pagination, options);
  }

  async createUser(userData: any, options?: QueryOptions) {
    return await this.userRepo.create(userData, options);
  }

  async updateUser(id: string, userData: any, options?: QueryOptions) {
    return await this.userRepo.update(id, userData, options);
  }

  async deactivateUser(id: string, options?: QueryOptions) {
    return await this.userRepo.deactivateUser(id, options);
  }

  async updateLastLogin(userId: string, options?: QueryOptions) {
    return await this.userRepo.updateLastLogin(userId, options);
  }

  async verifyUserEmail(userId: string, options?: QueryOptions) {
    return await this.userRepo.verifyEmail(userId, options);
  }

  // Role management methods
  async getRoleById(id: string) {
    return await this.roleRepo.findById(id);
  }

  async getRoleByName(name: string, options?: QueryOptions) {
    return await this.roleRepo.findByName(name, options);
  }

  async getRolesPaginated(
    pagination: PaginationOptions,
    systemRoles?: boolean,
    options?: QueryOptions
  ) {
    if (systemRoles === true) {
      return await this.roleRepo.findSystemRoles(pagination, options);
    } else if (systemRoles === false) {
      return await this.roleRepo.findUserRoles(pagination, options);
    }
    return await this.roleRepo.findActive(pagination, options);
  }

  async createRole(roleData: any, options?: QueryOptions) {
    return await this.roleRepo.createUserRole(roleData, options);
  }

  async updateRole(id: string, roleData: any, options?: QueryOptions) {
    return await this.roleRepo.update(id, roleData, options);
  }

  async deleteRole(id: string, options?: QueryOptions) {
    return await this.roleRepo.deleteRole(id, options);
  }

  // Permission management methods
  async getPermissionById(id: string) {
    return await this.permissionRepo.findById(id);
  }

  async getPermissionByName(name: string, options?: QueryOptions) {
    return await this.permissionRepo.findByName(name, options);
  }

  async getPermissionsPaginated(
    pagination: PaginationOptions,
    resource?: string,
    options?: QueryOptions
  ) {
    if (resource) {
      return await this.permissionRepo.findByResource(
        resource,
        pagination,
        options
      );
    }
    return await this.permissionRepo.findPaginated(
      pagination,
      undefined,
      options
    );
  }

  async createPermission(permissionData: any, options?: QueryOptions) {
    return await this.permissionRepo.create(permissionData, options);
  }

  async updatePermission(
    id: string,
    permissionData: any,
    options?: QueryOptions
  ) {
    return await this.permissionRepo.update(id, permissionData, options);
  }

  async deletePermission(id: string, options?: QueryOptions) {
    return await this.permissionRepo.delete(id, options);
  }

  async getUniqueResources(options?: QueryOptions) {
    return await this.permissionRepo.getUniqueResources(options);
  }

  async getUniqueActions(options?: QueryOptions) {
    return await this.permissionRepo.getUniqueActions(options);
  }

  // Advanced user permission methods
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const result = await rawClient`
        SELECT get_user_permissions(${userId}) as permissions
      `;

      return result[0]?.permissions || [];
    } catch (error) {
      console.error("Error getting user permissions:", error);
      throw error;
    }
  }

  async checkUserPermission(
    userId: string,
    permission: string
  ): Promise<boolean> {
    try {
      const result = await rawClient`
        SELECT user_has_permission(${userId}, ${permission}) as has_permission
      `;

      return result[0]?.has_permission || false;
    } catch (error) {
      console.error("Error checking user permission:", error);
      throw error;
    }
  }

  async getUserRoles(userId: string) {
    try {
      const result = await rawClient`
        SELECT * FROM get_user_roles(${userId})
      `;

      return result || [];
    } catch (error) {
      console.error("Error getting user roles:", error);
      throw error;
    }
  }

  // Bulk operations
  async assignRoleToUser(
    userId: string,
    roleId: string,
    assignedBy?: string,
    expiresAt?: Date,
    options?: QueryOptions
  ) {
    try {
      const userRoleData = {
        userId,
        roleId,
        assignedBy: assignedBy || null,
        expiresAt: expiresAt || null,
        isActive: true,
      };

      return await rawClient`
        INSERT INTO user_roles (user_id, role_id, assigned_by, expires_at, is_active)
        VALUES (${userId}, ${roleId}, ${assignedBy || null}, ${expiresAt || null}, true)
        ON CONFLICT (user_id, role_id) 
        DO UPDATE SET 
          is_active = true,
          assigned_by = ${assignedBy || null},
          expires_at = ${expiresAt || null},
          assigned_at = NOW()
        RETURNING *
      `;
    } catch (error) {
      console.error("Error assigning role to user:", error);
      throw error;
    }
  }

  async removeRoleFromUser(
    userId: string,
    roleId: string,
    options?: QueryOptions
  ) {
    try {
      return await rawClient`
        UPDATE user_roles 
        SET is_active = false 
        WHERE user_id = ${userId} AND role_id = ${roleId}
        RETURNING *
      `;
    } catch (error) {
      console.error("Error removing role from user:", error);
      throw error;
    }
  }
}
