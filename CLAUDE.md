# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a Turborepo monorepo using pnpm workspaces with the following structure:

- **apps/web** - Next.js 16 web application with tRPC client integration
- **packages/api** - tRPC API server with type-safe procedures
- **packages/database** - Drizzle ORM setup with PostgreSQL/Supabase
- **packages/ui** - Shared React components with Tailwind CSS
- **packages/config** - Shared TypeScript configuration

## Development Commands

### Root Level Commands (using Turbo)

```bash
# Start development servers for all apps
pnpm dev

# Build all packages and apps
pnpm build

# Run linting across all workspaces
pnpm lint

# Run type checking across all workspaces
pnpm type-check
```

### Supabase Local Development Setup

```bash
# Setup project-specific Supabase environment
pnpm setup:project <project-name>

# Start Supabase services
pnpm supabase:start

# Stop Supabase services
pnpm supabase:stop

# Restart Supabase services
pnpm supabase:restart

# Reset database (warning: destroys all data)
pnpm supabase:reset

# Check Supabase services status
pnpm supabase:status
```

### Database Commands (from root or packages/database)

```bash
# Generate database migrations
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Push schema changes directly to DB
pnpm db:push

# Open Drizzle Studio for database management
pnpm db:studio
```

### Web App Commands (from apps/web)

```bash
# Start Next.js development server
pnpm dev

# Build the Next.js application
pnpm build

# Start production server
pnpm start

# Run ESLint
pnpm lint

# Run TypeScript type checking
pnpm type-check
```

## Architecture Overview

### tRPC Full-Stack Setup

- **API Layer**: `packages/api` exports `appRouter` with type-safe procedures
- **Client Integration**: `apps/web` uses tRPC React Query integration
- **Server-side**: Next.js app router with tRPC caller factory for server components
- **Type Safety**: Shared `AppRouter` type provides end-to-end type safety

### Database Architecture

- **ORM**: Drizzle ORM with PostgreSQL driver
- **Schema**: Defined in `packages/database/src/schema.ts` with users and posts tables
- **Connection**: Uses Supabase connection string via `DATABASE_URL` environment variable
- **Migrations**: Managed through drizzle-kit with config in `drizzle.config.ts`
- **Local Development**: Supabase local stack with Docker Compose for isolated environments

### Supabase Multi-Project Setup

- **Isolated Environments**: Each project gets unique Docker containers and ports
- **Port Assignment**: Automatic port calculation based on project name hash
- **Configuration**: Project-specific `.env` files and Docker overrides
- **Services**: API, Database, Studio, Inbucket (email testing) with unique ports per project

### UI Package Structure

- **Components**: Reusable React components in `packages/ui`
- **Styling**: Tailwind CSS with class-variance-authority for component variants
- **Utilities**: Shared utility functions including `cn` for className merging

### Package Dependencies

- `@repo/api` depends on `@repo/database`
- `web` app depends on `@repo/api` and `@repo/ui`
- All packages use `@repo/config` for shared TypeScript configuration

## Key Files and Locations

- **API Router**: `packages/api/src/root.ts` - Main tRPC router definition
- **Database Schema**: `packages/database/src/schema.ts` - Drizzle schema definitions
- **Database Client**: `packages/database/src/client.ts` - Drizzle database connection
- **Web tRPC Setup**: `apps/web/src/trpc/` - Client and server tRPC configuration
- **Shared Config**: `packages/config/tsconfig.base.json` - Base TypeScript configuration
- **Supabase Config**: `supabase/config.toml` - Supabase local configuration
- **Docker Template**: `supabase/docker-compose.override.template.yml` - Template for project-specific overrides
- **Setup Script**: `scripts/setup-docker-project.js` - Automated project environment setup

## Environment Variables

### Generated Automatically by Setup Script

- **DATABASE_URL**: PostgreSQL/Supabase connection string (project-specific ports)
- **NEXT_PUBLIC_SUPABASE_URL**: Supabase API URL for frontend
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Anonymous access key for client-side operations
- **JWT_SECRET**: Secret for JWT token signing
- **ANON_KEY**: Anonymous role JWT token
- **SERVICE_ROLE_KEY**: Service role JWT token for admin operations

### Project Configuration

- **supabase.config.json**: Contains project name, ports, and service URLs
- **Generated .env files**: Automatically created for each workspace

## Multi-Project Workflow

### Setting up a new project instance:

1. Clone the repository to a new directory
2. Run `pnpm setup:project <unique-project-name>`
3. Start Supabase: `pnpm supabase:start`
4. Initialize database: `pnpm db:push`
5. Start development: `pnpm dev`

### Port isolation:

- Each project gets unique ports based on project name hash
- No manual port configuration needed
- Projects can run simultaneously without conflicts

## Package Manager

Uses pnpm with workspace configuration. Always use `pnpm` commands, not npm or yarn.
