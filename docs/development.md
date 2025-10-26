# Development Guide

This guide covers the development workflow, commands, and best practices.

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

### Supabase Local Development

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

### Database Commands

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

## Package Development

### Creating New Packages

1. **Create package directory:**

   ```bash
   mkdir packages/new-package
   cd packages/new-package
   ```

2. **Initialize package.json:**

   ```json
   {
     "name": "@repo/new-package",
     "version": "0.0.0",
     "main": "./src/index.ts",
     "types": "./src/index.ts",
     "scripts": {
       "dev": "tsc --watch",
       "build": "tsc",
       "lint": "eslint src/"
     },
     "devDependencies": {
       "@repo/config": "workspace:*",
       "typescript": "^5"
     }
   }
   ```

3. **Add to workspace dependencies where needed**

### Package Dependencies

- Use `workspace:*` for internal packages
- Add dev dependencies to individual packages
- Shared dependencies should be in root `package.json`

## Code Standards

### TypeScript Configuration

- All packages extend `@repo/config/tsconfig.base.json`
- Strict mode enabled
- Path mapping configured for internal imports

### ESLint Configuration

- Next.js config for web app
- Shared base configuration for packages
- Custom rules for tRPC and Drizzle

### File Organization

```
packages/[package-name]/
├── src/
│   ├── index.ts          # Main export file
│   └── [features]/       # Feature-based organization
├── package.json
└── tsconfig.json
```

## Development Workflow

### 1. Environment Setup

```bash
# Clone and setup
git clone <repository>
cd mono-repo
pnpm install
pnpm setup:project dev
pnpm supabase:start
```

### 2. Development Loop

```bash
# Start development
pnpm dev

# Make changes to code
# Changes auto-reload

# Test and lint
pnpm lint
pnpm type-check

# Build to verify
pnpm build
```

### 3. Database Changes

```bash
# Update schema in packages/database/src/schema.ts
# Push changes to database
pnpm db:push

# Or generate migration
pnpm db:generate
pnpm db:migrate
```

## Package-Specific Development

### API Development (`packages/api`)

- Add new routers in `src/routers/`
- Export from `src/root.ts`
- Use Drizzle ORM for database operations
- Follow tRPC patterns for type safety

### Database Development (`packages/database`)

- Update schema in `src/schema.ts`
- Export tables and types from `src/index.ts`
- Use `pnpm db:push` for development
- Use `pnpm db:generate` for production migrations

### UI Development (`packages/ui`)

- Create components in `src/`
- Use Tailwind CSS with class-variance-authority
- Export components from `src/index.tsx`
- Include prop types and documentation

### Web App Development (`apps/web`)

- Use App Router for new pages
- Implement tRPC client in components
- Follow Next.js 16 best practices
- Use shared UI components from `@repo/ui`

## Testing

### Unit Testing

- Add testing framework to individual packages
- Test database schemas and API endpoints
- Mock external dependencies

### Integration Testing

- Test full tRPC flow from frontend to database
- Use test database instances
- Verify type safety across boundaries

### E2E Testing

- Test complete user workflows
- Use production-like environment
- Include database state verification

## Deployment Preparation

### Build Verification

```bash
# Ensure all packages build successfully
pnpm build

# Run all checks
pnpm lint
pnpm type-check
```

### Environment Configuration

- Set production environment variables
- Configure database connection strings
- Set up proper secrets management

### Performance Optimization

- Bundle analysis for web app
- Database query optimization
- CDN configuration for static assets

## Troubleshooting

### Common Issues

1. **Type errors**: Run `pnpm type-check` to identify issues
2. **Build failures**: Check package dependencies and TypeScript config
3. **Database connection**: Verify Supabase is running and environment variables
4. **Port conflicts**: Use different project names or stop conflicting services

### Debug Tools

- Drizzle Studio for database inspection
- Next.js debug mode for frontend issues
- tRPC dev tools for API debugging

### Performance Monitoring

- Use Next.js built-in analytics
- Monitor database query performance
- Track build times with Turborepo
