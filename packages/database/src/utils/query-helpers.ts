import {
  SQL,
  sql,
  and,
  or,
  eq,
  ne,
  lt,
  lte,
  gt,
  gte,
  like,
  ilike,
  isNull,
  isNotNull,
  inArray,
  notInArray,
} from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";

export interface WhereCondition {
  column: string;
  operator:
    | "eq"
    | "ne"
    | "lt"
    | "lte"
    | "gt"
    | "gte"
    | "like"
    | "ilike"
    | "in"
    | "notIn"
    | "isNull"
    | "isNotNull";
  value?: any;
  values?: any[];
}

export interface QueryFilter {
  conditions: WhereCondition[];
  operator?: "and" | "or";
}

export class QueryBuilder {
  static buildWhereClause(
    filter: QueryFilter,
    tableColumns: Record<string, AnyColumn>
  ): SQL | undefined {
    if (!filter.conditions.length) return undefined;

    const conditions = filter.conditions
      .filter(condition => tableColumns[condition.column])
      .map(condition => {
        const column = tableColumns[condition.column];

        switch (condition.operator) {
          case "eq":
            return eq(column, condition.value);
          case "ne":
            return ne(column, condition.value);
          case "lt":
            return lt(column, condition.value);
          case "lte":
            return lte(column, condition.value);
          case "gt":
            return gt(column, condition.value);
          case "gte":
            return gte(column, condition.value);
          case "like":
            return like(column, condition.value);
          case "ilike":
            return ilike(column, condition.value);
          case "in":
            return inArray(column, condition.values || []);
          case "notIn":
            return notInArray(column, condition.values || []);
          case "isNull":
            return isNull(column);
          case "isNotNull":
            return isNotNull(column);
          default:
            throw new Error(`Unsupported operator: ${condition.operator}`);
        }
      });

    if (conditions.length === 0) return undefined;
    if (conditions.length === 1) return conditions[0];

    return filter.operator === "or" ? or(...conditions) : and(...conditions);
  }

  static buildSearchCondition(
    searchTerm: string,
    searchFields: string[],
    tableColumns: Record<string, AnyColumn>
  ): SQL | undefined {
    if (!searchTerm || !searchFields.length) return undefined;

    const conditions = searchFields
      .filter(field => tableColumns[field])
      .map(field => ilike(tableColumns[field], `%${searchTerm}%`));

    return conditions.length > 0 ? or(...conditions) : undefined;
  }

  static combineConditions(
    ...conditions: (SQL | undefined)[]
  ): SQL | undefined {
    const validConditions = conditions.filter(Boolean) as SQL[];

    if (validConditions.length === 0) return undefined;
    if (validConditions.length === 1) return validConditions[0];

    return and(...validConditions);
  }
}

export const queryHelpers = {
  // Date range helpers
  dateRange: (column: AnyColumn, startDate: Date, endDate: Date) =>
    and(gte(column, startDate), lte(column, endDate)),

  // Text search helpers
  textSearch: (column: AnyColumn, term: string, caseSensitive = false) =>
    caseSensitive ? like(column, `%${term}%`) : ilike(column, `%${term}%`),

  // Array containment helpers
  arrayContains: (column: AnyColumn, values: any[]) => inArray(column, values),

  // Null/empty checks
  isNotEmpty: (column: AnyColumn) => and(isNotNull(column), ne(column, "")),

  // Active/inactive helpers
  isActive: (column: AnyColumn) => eq(column, true),

  isInactive: (column: AnyColumn) => eq(column, false),

  // Pagination helpers
  offsetLimit: (page: number, limit: number) => ({
    offset: (page - 1) * limit,
    limit,
  }),
};
