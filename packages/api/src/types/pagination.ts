export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface CursorPaginationInput {
  cursor?: string | number;
  limit?: number;
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

export interface CursorPaginatedResult<T> {
  data: T[];
  pagination: {
    limit: number;
    hasNext: boolean;
    nextCursor?: string | number;
  };
}

export interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}
