# Deployment Guide

This document covers deployment strategies, configuration, and best practices for production environments.

## Overview

The monorepo is designed to be deployed across multiple platforms with flexibility in mind. The main deployments include:

- **Web App**: Next.js application (Vercel, Netlify, or custom hosting)
- **Database**: PostgreSQL (Supabase Cloud, AWS RDS, or self-hosted)
- **API**: tRPC endpoints (deployed with the web app)

## Quick Deploy

### Vercel (Recommended for Web App)

1. **Connect repository to Vercel**
2. **Configure build settings:**

   ```bash
   # Build Command
   pnpm build

   # Output Directory
   apps/web/.next

   # Install Command
   pnpm install
   ```

3. **Set environment variables:**
   ```bash
   DATABASE_URL=postgresql://username:password@host:port/database
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### Supabase Cloud (Recommended for Database)

1. **Create new project on Supabase**
2. **Get connection details from project settings**
3. **Run migrations:**
   ```bash
   # Update DATABASE_URL in .env
   pnpm db:push
   ```

## Environment Configuration

### Production Environment Variables

#### Required for Web App

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database
DIRECT_URL=postgresql://username:password@host:port/database

# Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Next.js
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.com
```

#### Optional

```bash
# Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id

# Error Tracking
SENTRY_DSN=your-sentry-dsn

# Feature Flags
FEATURE_FLAG_API_KEY=your-feature-flag-key
```

### Environment Variable Management

#### Development

```bash
# Local environment files (not committed)
.env.local              # Local overrides
apps/web/.env.local     # Web app specific
packages/database/.env  # Database specific
```

#### Production

- Use platform-specific environment variable settings
- Store secrets in secure secret management services
- Use different values for staging and production

## Build Process

### Local Build Testing

```bash
# Build all packages
pnpm build

# Test production build locally
cd apps/web
pnpm start
```

### CI/CD Pipeline

#### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 10.17.0

      - name: Install dependencies
        run: pnpm install

      - name: Type check
        run: pnpm type-check

      - name: Lint
        run: pnpm lint

      - name: Build
        run: pnpm build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Platform-Specific Deployment

### Vercel

#### Configuration

```json
// vercel.json
{
  "builds": [
    {
      "src": "apps/web/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/trpc/(.*)",
      "dest": "/api/trpc/$1"
    }
  ]
}
```

#### Build Settings

- **Framework Preset**: Next.js
- **Build Command**: `pnpm build`
- **Output Directory**: `apps/web/.next`
- **Install Command**: `pnpm install`
- **Root Directory**: Leave empty (monorepo auto-detected)

### Netlify

#### Configuration

```toml
# netlify.toml
[build]
  command = "pnpm build"
  publish = "apps/web/.next"

[build.environment]
  NODE_VERSION = "18"
  PNPM_VERSION = "10.17.0"

[[redirects]]
  from = "/api/trpc/*"
  to = "/.netlify/functions/api/:splat"
  status = 200
```

### Docker Deployment

#### Multi-stage Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/
COPY apps/*/package.json ./apps/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["pnpm", "start"]
```

#### Docker Compose (Production)

```yaml
# docker-compose.prod.yml
version: "3.8"
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Database Deployment

### Supabase Cloud

1. Create project on Supabase Dashboard
2. Get connection string from project settings
3. Set `DATABASE_URL` environment variable
4. Run migrations: `pnpm db:push` or `pnpm db:migrate`

### Self-hosted PostgreSQL

#### AWS RDS

1. Create RDS PostgreSQL instance
2. Configure security groups for access
3. Get connection details
4. Set environment variables

#### Google Cloud SQL

1. Create Cloud SQL PostgreSQL instance
2. Configure authorized networks
3. Create database user
4. Set connection string

### Migration Strategy

#### Production Migrations

```bash
# Generate migration
pnpm db:generate

# Review migration files
# packages/database/drizzle/[timestamp]_migration.sql

# Apply to staging
DATABASE_URL=staging_url pnpm db:migrate

# Test on staging
# Apply to production
DATABASE_URL=production_url pnpm db:migrate
```

#### Zero-downtime Migrations

1. **Backward-compatible changes first**
2. **Deploy application code**
3. **Apply database migrations**
4. **Clean up deprecated code**

## Performance Optimization

### Next.js Optimization

#### Build Optimization

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
  transpilePackages: ["@repo/ui", "@repo/api"],
};
```

#### Bundle Analysis

```bash
# Analyze bundle size
pnpm build --analyze

# Check for unused dependencies
npx depcheck
```

### Database Optimization

#### Connection Pooling

```typescript
// packages/database/src/client.ts
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, {
  max: 20, // Maximum number of connections
  idle_timeout: 20, // Close connections after 20 seconds of inactivity
  max_lifetime: 60 * 30, // Close connections after 30 minutes
});
```

#### Indexes

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
```

### CDN Configuration

#### Static Assets

- Configure CDN for `/_next/static/*` paths
- Set appropriate cache headers
- Enable gzip/brotli compression

#### API Caching

```typescript
// Cache API responses where appropriate
export const revalidate = 60; // Cache for 60 seconds
```

## Monitoring and Observability

### Error Tracking

#### Sentry Integration

```typescript
// apps/web/sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Performance Monitoring

#### Next.js Analytics

```typescript
// apps/web/next.config.js
module.exports = {
  experimental: {
    instrumentationHook: true,
  },
};
```

#### Database Monitoring

- Monitor query performance
- Set up alerts for slow queries
- Track connection pool usage

### Health Checks

#### API Health Check

```typescript
// apps/web/app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    await db.select().from(users).limit(1);

    return Response.json({ status: "healthy" });
  } catch (error) {
    return Response.json(
      { status: "unhealthy", error: error.message },
      { status: 500 }
    );
  }
}
```

## Security Considerations

### Environment Security

- Never commit secrets to version control
- Use secure secret management services
- Rotate secrets regularly
- Implement least privilege access

### Database Security

- Use connection SSL in production
- Implement proper authentication
- Regular security updates
- Database access auditing

### Application Security

- Implement proper CORS policies
- Use HTTPS in production
- Set security headers
- Regular dependency updates

## Rollback Strategies

### Application Rollback

1. **Git-based**: Deploy previous commit
2. **Platform-specific**: Use platform rollback features
3. **Blue-green**: Maintain parallel environments

### Database Rollback

1. **Backup before migrations**
2. **Write rollback scripts**
3. **Test rollback procedures**
4. **Document rollback steps**

## Troubleshooting

### Common Deployment Issues

#### Build Failures

```bash
# Clear all caches
pnpm clean
rm -rf node_modules
pnpm install

# Check for type errors
pnpm type-check

# Check for missing dependencies
pnpm audit
```

#### Runtime Errors

1. **Check environment variables**
2. **Verify database connectivity**
3. **Review application logs**
4. **Check security group/firewall settings**

#### Performance Issues

1. **Monitor database query performance**
2. **Check for memory leaks**
3. **Analyze bundle size**
4. **Review caching strategies**
