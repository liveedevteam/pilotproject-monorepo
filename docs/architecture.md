# Architecture

This document describes the system architecture and design decisions for the monorepo.

## Repository Structure

```
mono-repo/
├── apps/
│   └── web/                    # Next.js 16 web application
├── packages/
│   ├── api/                    # tRPC API server
│   ├── database/               # Drizzle ORM setup
│   ├── ui/                     # Shared React components
│   └── config/                 # Shared TypeScript configuration
├── scripts/                    # Setup and utility scripts
├── supabase/                   # Supabase configuration
└── docs/                       # Documentation
```

## Technology Stack

### Frontend

- **Next.js 16** with App Router
- **React 19** with React Compiler
- **Tailwind CSS 4** for styling
- **TypeScript** for type safety

### Backend

- **tRPC** for type-safe API
- **Drizzle ORM** for database operations
- **PostgreSQL** via Supabase
- **Supabase** for backend services

### Development Tools

- **Turborepo** for monorepo management
- **pnpm** for package management
- **ESLint** for code linting
- **Docker** for local development

## Data Flow

```
User Request → Next.js App → tRPC Client → tRPC Server → Drizzle ORM → PostgreSQL
```

### tRPC Full-Stack Setup

- **API Layer**: `packages/api` exports `appRouter` with type-safe procedures
- **Client Integration**: `apps/web` uses tRPC React Query integration
- **Server-side**: Next.js app router with tRPC caller factory for server components
- **Type Safety**: Shared `AppRouter` type provides end-to-end type safety

## Database Architecture

### Schema Design

Current tables defined in `packages/database/src/schema.ts`:

- **users**: User accounts with id, name, email, createdAt
- **posts**: Blog posts with id, title, content, authorId, createdAt

### ORM Configuration

- **Driver**: PostgreSQL driver via Drizzle
- **Connection**: Supabase connection string via `DATABASE_URL`
- **Migrations**: Managed through drizzle-kit with config in `drizzle.config.ts`

### Local Development

- **Supabase Local Stack**: Docker Compose for isolated environments
- **Multi-Project Support**: Each project gets unique Docker containers and ports
- **Port Assignment**: Automatic port calculation based on project name hash

## Package Dependencies

```
web app
├── @repo/api (depends on @repo/database)
├── @repo/ui
└── @repo/config

@repo/api
├── @repo/database
└── @repo/config

@repo/database
└── @repo/config

@repo/ui
└── @repo/config
```

## Key Design Decisions

### Monorepo Structure

- **Turborepo**: Enables efficient builds and caching across packages
- **Workspace Dependencies**: Internal packages use `workspace:*` protocol
- **Shared Configuration**: Base TypeScript config shared across all packages

### Type Safety

- **End-to-End Types**: tRPC ensures type safety from database to frontend
- **Drizzle Schema**: Database schema generates TypeScript types
- **Strict TypeScript**: All packages use strict TypeScript configuration

### Development Experience

- **Hot Reload**: All packages support development mode with hot reloading
- **Isolated Environments**: Multiple project instances can run simultaneously
- **Automatic Setup**: Scripts handle environment configuration automatically

### Styling Architecture

- **Tailwind CSS**: Utility-first CSS framework
- **Component Variants**: class-variance-authority for component styling
- **Design System**: Shared UI components in `@repo/ui`

## Security Considerations

### Environment Variables

- **Local Development**: Auto-generated secure defaults
- **Production**: Use proper secrets management
- **Database**: Connection strings with appropriate authentication

### API Security

- **tRPC**: Built-in request validation and type safety
- **CORS**: Properly configured for frontend domains
- **Authentication**: Ready for integration with Supabase Auth

## Scalability

### Horizontal Scaling

- **Stateless API**: tRPC procedures are stateless
- **Database Connection Pooling**: Supabase handles connection management
- **CDN Ready**: Next.js optimized for edge deployment

### Development Scaling

- **Package Isolation**: Changes to one package don't affect others unnecessarily
- **Incremental Builds**: Turborepo only rebuilds what changed
- **Team Collaboration**: Clear package boundaries enable team scaling
