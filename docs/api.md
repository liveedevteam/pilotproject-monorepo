# API Documentation

This document covers the tRPC API setup, available endpoints, and integration patterns.

## Overview

The API layer uses **tRPC** for type-safe API calls between the Next.js frontend and the backend. The API package (`@repo/api`) provides routers, procedures, and type definitions.

## Architecture

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

#### Get User by ID

```typescript
// Endpoint: user.getById
// Method: query
// Input: { id: number }
// Output: User[]

const user = await trpc.user.getById.useQuery({ id: 1 });
```

#### Create User

```typescript
// Endpoint: user.create
// Method: mutation
// Input: { name: string, email: string }
// Output: User[]

const createUser = trpc.user.create.useMutation();
await createUser.mutateAsync({
  name: "John Doe",
  email: "john@example.com",
});
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
import { appRouter } from "@repo/api";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => ({}),
  });

export { handler as GET, handler as POST };
```

## Adding New Endpoints

### 1. Create a New Router

```typescript
// packages/api/src/routers/posts.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { db, posts, users } from "@repo/database";
import { eq } from "drizzle-orm";

export const postRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    return await db.select().from(posts);
  }),

  getByAuthor: publicProcedure
    .input(z.object({ authorId: z.number() }))
    .query(async ({ input }) => {
      return await db
        .select()
        .from(posts)
        .where(eq(posts.authorId, input.authorId));
    }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().optional(),
        authorId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await db.insert(posts).values(input).returning();
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

### TRPCError

```typescript
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const user = await db.select().from(users).where(eq(users.id, input.id));

      if (!user.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user[0];
    }),
});
```

### Client Error Handling

```typescript
const { data, error, isError } = trpc.user.getById.useQuery({ id: 1 });

if (isError) {
  console.error("Error code:", error.data?.code);
  console.error("Error message:", error.message);
}
```

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

### Router Organization

- One router per domain/entity
- Keep routers focused and cohesive
- Use descriptive procedure names
- Group related procedures together

### Input Validation

- Always validate inputs with Zod
- Provide meaningful error messages
- Use appropriate constraints (min, max, etc.)
- Consider custom validation for business rules

### Error Handling

- Use appropriate HTTP status codes
- Provide helpful error messages
- Log errors for debugging
- Handle database constraints gracefully

### Type Safety

- Export and use TypeScript types
- Avoid `any` types
- Use proper return types
- Leverage tRPC's inference

### Performance

- Use React Query features (caching, invalidation)
- Implement proper pagination
- Consider prefetching for critical data
- Monitor query performance
