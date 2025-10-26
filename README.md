# MONO_REPO

This directory contains all project documentation organized by topic.

## Structure

- **[Getting Started](./docs/getting-started.md)** - Quick start guide for new developers
- **[Architecture](./docs/architecture.md)** - System architecture and design decisions
- **[Development](./docs/development.md)** - Development workflow and commands
- **[Database](./docs/database.md)** - Database setup, schema, and operations
- **[API](./docs/api.md)** - API documentation and tRPC setup
- **[Deployment](./docs/deployment.md)** - Deployment guides and configuration
- **[Supabase Setup](./docs/supabase-setup.md)** - Local Supabase development setup
- **[Web App](./docs/web-app.md)** - Next.js web application documentation

## Project Overview

This is a Turborepo monorepo using pnpm workspaces with:

- **apps/web** - Next.js 16 web application with tRPC client integration
- **packages/api** - tRPC API server with type-safe procedures
- **packages/database** - Drizzle ORM setup with PostgreSQL/Supabase
- **packages/ui** - Shared React components with Tailwind CSS
- **packages/config** - Shared TypeScript configuration

## Quick Commands

```bash
# Setup new project environment
pnpm setup:project <project-name>

# Start all services
pnpm supabase:start
pnpm dev

# Database operations
pnpm db:push
pnpm db:studio

# Build and test
pnpm build
pnpm lint
pnpm type-check
```

For detailed instructions, see the specific documentation files listed above.
