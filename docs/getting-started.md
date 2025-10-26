# Getting Started

This guide will help you set up the development environment and get the project running locally.

## Prerequisites

- Node.js 18+
- pnpm 10.17.0+ (specified in package.json)
- Docker and Docker Compose (for Supabase)

## Quick Setup

1. **Clone and install dependencies:**

   ```bash
   git clone <repository-url>
   cd mono-repo
   pnpm install
   ```

2. **Setup project environment:**

   ```bash
   pnpm setup:project dev
   ```

3. **Start Supabase services:**

   ```bash
   pnpm supabase:start
   ```

4. **Initialize database:**

   ```bash
   pnpm db:push
   ```

5. **Start development servers:**
   ```bash
   pnpm dev
   ```

## Access Points

After setup, your services will be available at:

- **Web App**: http://localhost:3001 (or 3000 if available)
- **Supabase Studio**: http://127.0.0.1:[studio-port] (check output from setup)
- **API**: http://127.0.0.1:[api-port]
- **Database**: 127.0.0.1:[db-port]
- **Inbucket (Email Testing)**: http://127.0.0.1:[inbucket-port]

Ports are automatically assigned based on your project name to avoid conflicts.

## Development Workflow

1. Make changes to code
2. Changes auto-reload in development mode
3. Run tests and type checking: `pnpm lint && pnpm type-check`
4. Build for production: `pnpm build`

## Multiple Project Instances

You can run multiple project instances simultaneously by using different project names:

```bash
# Terminal 1 - Development environment
pnpm setup:project dev
pnpm supabase:start
pnpm dev

# Terminal 2 - Testing environment
pnpm setup:project test
pnpm supabase:start
pnpm dev
```

Each instance gets isolated Docker containers and unique ports.

## Troubleshooting

- **Port conflicts**: Use different project names or stop existing services
- **Database connection issues**: Check if Supabase is running with `pnpm supabase:status`
- **Build errors**: Run `pnpm type-check` to identify TypeScript issues

For more detailed information, see the other documentation files.
