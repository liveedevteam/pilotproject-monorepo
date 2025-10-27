import type { PgDatabase } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import type * as schema from "../schemas";

export type Database = PgDatabase<PostgresJsQueryResultHKT, typeof schema>;

export interface DatabaseConfig {
  connectionString: string;
  ssl?: boolean;
  maxConnections?: number;
  idleTimeout?: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface QueryOptions {
  transaction?: boolean;
  timeout?: number;
}

export interface AuditFields {
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeleteFields {
  isActive: boolean;
  deletedAt?: Date | null;
}
