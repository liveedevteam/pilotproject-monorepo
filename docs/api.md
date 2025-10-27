# API Documentation

This document covers the tRPC API setup, available endpoints, and integration patterns.

## Overview

The API layer uses **tRPC** for type-safe API calls between the Next.js frontend and the backend. The API package (`@repo/api`) provides routers, procedures, and type definitions.

## Architecture

### Service Layer Pattern

The API follows a layered architecture for scalability and maintainability:

```
┌─────────────────┐
│   tRPC Router   │ ← API layer (validation, transformation)
└─────────────────┘
         │
┌─────────────────┐
│  Service Layer  │ ← Business logic, orchestration
└─────────────────┘
         │
┌─────────────────┐
│ Repository Layer│ ← Data access abstraction
└─────────────────┘
         │
┌─────────────────┐
│   Database      │ ← Drizzle ORM
└─────────────────┘
```

### Directory Structure

```
packages/api/src/
├── routers/           # tRPC route definitions
│   └── user.ts       # User-specific routes
├── services/          # Business logic layer
│   └── user-service.ts
├── repositories/      # Data access layer
│   └── user-repository.ts
├── types/            # Shared interfaces
│   └── user.ts
├── errors/           # Custom error classes
│   └── api-errors.ts
├── root.ts           # Main router definition
└── trpc.ts           # tRPC configuration
```

### Layer Responsibilities

- **Routers**: Input validation with Zod, tRPC procedure definitions, HTTP concerns
- **Services**: Business logic, validation, error handling, orchestration between repositories
- **Repositories**: Data access patterns, database operations, query optimization
- **Types**: Shared interfaces and type definitions for consistency
- **Errors**: Custom error classes with proper tRPC error codes and messages

### tRPC Setup

- **API Router**: Defined in `packages/api/src/root.ts`
- **Client Integration**: `apps/web/src/trpc/` contains client and server setup
- **Type Safety**: Shared `AppRouter` type provides end-to-end type safety
- **Runtime**: Both server-side and client-side usage supported

### Current API Structure

```typescript
// packages/api/src/root.ts
export const appRouter = createTRPCRouter({
  user: userRouter,
  // Add more routers here
});

export type AppRouter = typeof appRouter;
```

## Available Endpoints

### User Router (`/api/trpc/user`)

#### Get All Users

```typescript
// Endpoint: user.getAll
// Method: query
// Input: none
// Output: User[]

const users = await trpc.user.getAll.useQuery();
```

#### Get Users with Pagination

```typescript
// Endpoint: user.getPaginated
// Method: query
// Input: { page?, limit?, search?, sortBy?, sortOrder? }
// Output: PaginatedResult<User>

const paginatedUsers = await trpc.user.getPaginated.useQuery({
  page: 1,
  limit: 10,
  search: "john",
  sortBy: "createdAt",
  sortOrder: "desc",
});

// Response structure:
// {
//   data: User[],
//   pagination: {
//     page: number,
//     limit: number,
//     total: number,
//     totalPages: number,
//     hasNext: boolean,
//     hasPrevious: boolean
//   }
// }
```

#### Get User by ID

```typescript
// Endpoint: user.getById
// Method: query
// Input: { id: number } (must be positive integer)
// Output: User
// Throws: UserNotFoundError if user doesn't exist

const user = await trpc.user.getById.useQuery({ id: 1 });
```

#### Create User

```typescript
// Endpoint: user.create
// Method: mutation
// Input: { name: string, email: string } (validated for format and length)
// Output: User
// Throws: UserAlreadyExistsError if email already exists

const createUser = trpc.user.create.useMutation();
await createUser.mutateAsync({
  name: "John Doe",
  email: "john@example.com",
});
```

#### Update User

```typescript
// Endpoint: user.update
// Method: mutation
// Input: { id: number, name?: string, email?: string }
// Output: User
// Throws: UserNotFoundError, UserAlreadyExistsError

const updateUser = trpc.user.update.useMutation();
await updateUser.mutateAsync({
  id: 1,
  name: "John Smith",
  email: "john.smith@example.com",
});
```

#### Delete User

```typescript
// Endpoint: user.delete
// Method: mutation
// Input: { id: number }
// Output: { success: true }
// Throws: UserNotFoundError if user doesn't exist

const deleteUser = trpc.user.delete.useMutation();
await deleteUser.mutateAsync({ id: 1 });
```

## Usage Patterns

### Client-Side Usage (React Components)

#### Queries

```typescript
import { trpc } from '@/trpc/client'

function UserList() {
  const { data: users, isLoading, error } = trpc.user.getAll.useQuery()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {users?.map(user => (
        <li key={user.id}>{user.name} - {user.email}</li>
      ))}
    </ul>
  )
}
```

#### Mutations

```typescript
import { trpc } from '@/trpc/client'

function CreateUserForm() {
  const createUser = trpc.user.create.useMutation({
    onSuccess: () => {
      // Invalidate and refetch user list
      trpc.useUtils().user.getAll.invalidate()
    }
  })

  const handleSubmit = (data: { name: string; email: string }) => {
    createUser.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button
        type="submit"
        disabled={createUser.isLoading}
      >
        {createUser.isLoading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  )
}
```

### Server-Side Usage (Next.js App Router)

#### Server Components

```typescript
import { api } from '@/trpc/server'

export default async function UsersPage() {
  const users = await api.user.getAll()

  return (
    <div>
      <h1>Users</h1>
      {users.map(user => (
        <div key={user.id}>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
      ))}
    </div>
  )
}
```

#### API Routes

```typescript
// app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createTRPCContext } from "@repo/api";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () =>
      createTRPCContext({
        headers: req.headers,
      }),
  });

export { handler as GET, handler as POST };
```

## Service Layer Implementation

### Creating a New Feature

Follow these steps to add a new feature using the service layer pattern:

#### 1. Define Types

```typescript
// packages/api/src/types/post.ts
export interface CreatePostInput {
  title: string;
  content?: string;
  authorId: number;
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
}

export interface Post {
  id: number;
  title: string;
  content: string | null;
  authorId: number;
  createdAt: Date;
}
```

#### 2. Create Repository Layer

```typescript
// packages/api/src/repositories/post-repository.ts
import { db, posts } from "@repo/database";
import { eq } from "drizzle-orm";
import type { CreatePostInput, UpdatePostInput, Post } from "../types/post";

export class PostRepository {
  async findAll(): Promise<Post[]> {
    return await db.select().from(posts);
  }

  async findById(id: number): Promise<Post | null> {
    const result = await db.select().from(posts).where(eq(posts.id, id));
    return result[0] || null;
  }

  async findByAuthor(authorId: number): Promise<Post[]> {
    return await db.select().from(posts).where(eq(posts.authorId, authorId));
  }

  async create(postData: CreatePostInput): Promise<Post> {
    const result = await db.insert(posts).values(postData).returning();
    return result[0];
  }

  async update(id: number, postData: UpdatePostInput): Promise<Post | null> {
    const result = await db
      .update(posts)
      .set(postData)
      .where(eq(posts.id, id))
      .returning();
    return result[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id)).returning();
    return result.length > 0;
  }
}
```

#### 3. Create Service Layer

```typescript
// packages/api/src/services/post-service.ts
import { PostRepository } from "../repositories/post-repository";
import { UserRepository } from "../repositories/user-repository";
import {
  PostNotFoundError,
  UserNotFoundError,
  ValidationError,
} from "../errors/api-errors";
import type { CreatePostInput, UpdatePostInput, Post } from "../types/post";

export class PostService {
  private postRepository: PostRepository;
  private userRepository: UserRepository;

  constructor() {
    this.postRepository = new PostRepository();
    this.userRepository = new UserRepository();
  }

  async getAllPosts(): Promise<Post[]> {
    return await this.postRepository.findAll();
  }

  async getPostById(id: number): Promise<Post> {
    if (!id || id <= 0) {
      throw new ValidationError("Invalid post ID provided");
    }

    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new PostNotFoundError(id);
    }

    return post;
  }

  async createPost(postData: CreatePostInput): Promise<Post> {
    // Validate author exists
    const author = await this.userRepository.findById(postData.authorId);
    if (!author) {
      throw new UserNotFoundError(postData.authorId);
    }

    // Validate input
    if (!postData.title?.trim()) {
      throw new ValidationError("Title is required and cannot be empty");
    }

    return await this.postRepository.create({
      ...postData,
      title: postData.title.trim(),
    });
  }

  async updatePost(id: number, postData: UpdatePostInput): Promise<Post> {
    const existingPost = await this.getPostById(id); // This handles validation

    const updateData: UpdatePostInput = {};
    if (postData.title?.trim()) {
      updateData.title = postData.title.trim();
    }
    if (postData.content !== undefined) {
      updateData.content = postData.content;
    }

    const updatedPost = await this.postRepository.update(id, updateData);
    if (!updatedPost) {
      throw new PostNotFoundError(id);
    }

    return updatedPost;
  }

  async deletePost(id: number): Promise<void> {
    await this.getPostById(id); // Ensure post exists
    await this.postRepository.delete(id);
  }
}
```

#### 4. Create Custom Errors

```typescript
// packages/api/src/errors/api-errors.ts (add to existing)
export class PostNotFoundError extends TRPCError {
  constructor(id: number) {
    super({
      code: "NOT_FOUND",
      message: `Post with id ${id} not found`,
    });
  }
}
```

#### 5. Create Router

```typescript
// packages/api/src/routers/post.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { PostService } from "../services/post-service";

const postService = new PostService();

export const postRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    return await postService.getAllPosts();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      return await postService.getPostById(input.id);
    }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        content: z.string().optional(),
        authorId: z.number().int().positive(),
      })
    )
    .mutation(async ({ input }) => {
      return await postService.createPost(input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        title: z.string().min(1).max(255).optional(),
        content: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      return await postService.updatePost(id, updateData);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await postService.deletePost(input.id);
      return { success: true };
    }),
});
```

### 2. Add Router to App Router

```typescript
// packages/api/src/root.ts
import { postRouter } from "./routers/posts";

export const appRouter = createTRPCRouter({
  user: userRouter,
  post: postRouter, // Add the new router
});
```

### 3. Use in Frontend

```typescript
// Client component
const posts = trpc.post.getAll.useQuery();
const createPost = trpc.post.create.useMutation();

// Server component
const posts = await api.post.getAll();
```

## Input Validation

### Zod Schemas

All inputs are validated using Zod schemas:

```typescript
// Simple validation
.input(z.object({
  id: z.number().min(1),
  name: z.string().min(1).max(255),
  email: z.string().email(),
}))

// Complex validation
.input(z.object({
  user: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    age: z.number().min(18, "Must be 18 or older").optional(),
  }),
  preferences: z.array(z.string()).optional(),
}))
```

### Custom Validation

```typescript
.input(z.object({
  email: z.string().refine(
    (email) => email.endsWith('@company.com'),
    { message: "Must be a company email" }
  ),
}))
```

## Error Handling

### Custom Error Classes

The API uses custom error classes that extend TRPCError for consistent error handling:

```typescript
// packages/api/src/errors/api-errors.ts
import { TRPCError } from "@trpc/server";

export class UserNotFoundError extends TRPCError {
  constructor(id: number) {
    super({
      code: "NOT_FOUND",
      message: `User with id ${id} not found`,
    });
  }
}

export class UserAlreadyExistsError extends TRPCError {
  constructor(email: string) {
    super({
      code: "CONFLICT",
      message: `User with email ${email} already exists`,
    });
  }
}

export class ValidationError extends TRPCError {
  constructor(message: string) {
    super({
      code: "BAD_REQUEST",
      message,
    });
  }
}
```

### Error Handling in Services

```typescript
// Services handle business logic errors
export class UserService {
  async getUserById(id: number): Promise<User> {
    if (!id || id <= 0) {
      throw new ValidationError("Invalid user ID provided");
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }

    return user;
  }

  async createUser(userData: CreateUserInput): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new UserAlreadyExistsError(userData.email);
    }

    return await this.userRepository.create(userData);
  }
}
```

### Client Error Handling

```typescript
const { data, error, isError } = trpc.user.getById.useQuery({ id: 1 });

if (isError) {
  console.error("Error code:", error.data?.code);
  console.error("Error message:", error.message);

  // Handle specific error types
  if (error.data?.code === "NOT_FOUND") {
    // Handle user not found
  } else if (error.data?.code === "CONFLICT") {
    // Handle user already exists
  }
}

// In mutations
const createUser = trpc.user.create.useMutation({
  onError: error => {
    if (error.data?.code === "CONFLICT") {
      toast.error("Email already exists");
    } else {
      toast.error("Failed to create user");
    }
  },
});
```

### Error Types by HTTP Status

- **400 BAD_REQUEST**: Validation errors, invalid input
- **401 UNAUTHORIZED**: Authentication required
- **403 FORBIDDEN**: Insufficient permissions
- **404 NOT_FOUND**: Resource not found
- **409 CONFLICT**: Resource already exists, constraint violations
- **500 INTERNAL_SERVER_ERROR**: Unexpected server errors

## Authentication & Middleware

### Context Setup

```typescript
// packages/api/src/trpc.ts
export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  return {
    // Add user session, database, etc.
    user: await getUserFromRequest(opts.req),
    db,
  };
};

type Context = inferAsyncReturnType<typeof createTRPCContext>;
```

### Protected Procedures

```typescript
const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(({ ctx }) => {
    return ctx.user; // TypeScript knows user exists
  }),
});
```

## Performance Optimization

### React Query Integration

tRPC uses React Query under the hood:

```typescript
// Prefetch data
const utils = trpc.useUtils();
await utils.user.getAll.prefetch();

// Invalidate cache
utils.user.getAll.invalidate();

// Set data manually
utils.user.getAll.setData(undefined, newUsers);
```

### Server-Side Caching

```typescript
// Cache with React Query on server
export default async function UsersPage() {
  // This will be cached by React
  const users = await api.user.getAll()
  return <UserList users={users} />
}
```

## Testing

### API Testing

```typescript
import { appRouter } from "@repo/api";

describe("User Router", () => {
  it("should create user", async () => {
    const caller = appRouter.createCaller({
      // Mock context
      user: null,
      db: mockDb,
    });

    const result = await caller.user.create({
      name: "Test User",
      email: "test@example.com",
    });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Test User");
  });
});
```

### Integration Testing

```typescript
import { createTRPCMsw } from "msw-trpc";
import { setupServer } from "msw/node";

const trpcMsw = createTRPCMsw<AppRouter>();
const server = setupServer(
  trpcMsw.user.getAll.query(() => [
    { id: 1, name: "John", email: "john@example.com" },
  ])
);
```

## Best Practices

### Service Layer Architecture

- **Single Responsibility**: Each service handles one domain/entity
- **Dependency Injection**: Services depend on repositories, not direct database access
- **Business Logic**: Keep business rules in services, not routers or repositories
- **Error Handling**: Services throw domain-specific errors
- **Testing**: Services are easily unit testable

### Repository Pattern

- **Data Access Only**: Repositories handle only database operations
- **Generic Methods**: Use common patterns (findById, findAll, create, update, delete)
- **Query Optimization**: Keep complex queries in repositories
- **Single Source**: One repository per entity/table

### Router Organization

- **Thin Controllers**: Routers should be thin, delegating to services
- **Input Validation**: Use Zod for comprehensive input validation
- **Error Propagation**: Let service errors bubble up naturally
- **Consistent Patterns**: Follow same structure across all routers

### Input Validation

- **Zod Schemas**: Always validate inputs with Zod at router level
- **Business Validation**: Additional validation in services
- **Meaningful Messages**: Provide clear, actionable error messages
- **Constraints**: Use appropriate constraints (min, max, email, etc.)

```typescript
// Router validation (format, type, basic constraints)
.input(z.object({
  email: z.string().email().max(255),
  age: z.number().int().min(18).max(120),
}))

// Service validation (business rules)
if (userData.email.endsWith('@competitor.com')) {
  throw new ValidationError('Cannot register with competitor email');
}
```

### Error Handling Strategy

- **Custom Error Classes**: Create specific error types for different scenarios
- **Proper HTTP Codes**: Use semantically correct HTTP status codes
- **Error Logging**: Log errors appropriately for debugging
- **Client-Friendly Messages**: Provide helpful messages to frontend

### Type Safety

- **Interface Definitions**: Define clear interfaces for inputs/outputs
- **Type Exports**: Export types for use across packages
- **Avoid Any**: Never use `any` types
- **Leverage Inference**: Use tRPC's type inference capabilities

### Testing Strategy

```typescript
// Service unit tests
describe("UserService", () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    userService = new UserService();
    userService["userRepository"] = mockUserRepository;
  });

  it("should create user successfully", async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue(mockUser);

    const result = await userService.createUser(createUserInput);

    expect(result).toEqual(mockUser);
    expect(mockUserRepository.create).toHaveBeenCalledWith(createUserInput);
  });
});
```

### Performance Optimization

- **Repository Caching**: Implement caching at repository level for frequently accessed data
- **Query Optimization**: Use proper indexes and optimized queries
- **Pagination**: Always use pagination for large datasets
- **React Query**: Leverage React Query features (caching, invalidation, prefetching)
- **Monitoring**: Monitor query performance and optimize bottlenecks

### Pagination Implementation

#### Basic Pagination

```typescript
// Client-side usage
const UsersList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = trpc.user.getPaginated.useQuery({
    page,
    limit: 20,
    search,
    sortBy: "createdAt",
    sortOrder: "desc"
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search users..."
      />

      <div>
        {data?.data.map(user => (
          <div key={user.id}>{user.name} - {user.email}</div>
        ))}
      </div>

      <div>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={!data?.pagination.hasPrevious}
        >
          Previous
        </button>

        <span>
          Page {data?.pagination.page} of {data?.pagination.totalPages}
        </span>

        <button
          onClick={() => setPage(p => p + 1)}
          disabled={!data?.pagination.hasNext}
        >
          Next
        </button>
      </div>
    </div>
  );
};
```

#### Pagination Parameters

- **page**: Page number (starts from 1, default: 1)
- **limit**: Items per page (1-100, default: 10)
- **search**: Search term for name/email (optional)
- **sortBy**: Sort field - `id`, `name`, `email`, `createdAt` (default: `id`)
- **sortOrder**: Sort direction - `asc`, `desc` (default: `asc`)

#### Search Functionality

The search parameter performs case-insensitive partial matching on:

- User name
- User email

```typescript
// Search for users with "john" in name or email
const results = await trpc.user.getPaginated.useQuery({
  search: "john",
  page: 1,
  limit: 10,
});
```

#### Sorting Options

```typescript
// Sort by creation date, newest first
const recent = await trpc.user.getPaginated.useQuery({
  sortBy: "createdAt",
  sortOrder: "desc",
});

// Sort by name alphabetically
const alphabetical = await trpc.user.getPaginated.useQuery({
  sortBy: "name",
  sortOrder: "asc",
});
```

### Security Considerations

- **Input Sanitization**: Always validate and sanitize inputs
- **SQL Injection**: Use parameterized queries (Drizzle handles this)
- **Authentication**: Implement proper authentication middleware
- **Authorization**: Check permissions at service level
- **Rate Limiting**: Implement rate limiting for API endpoints
