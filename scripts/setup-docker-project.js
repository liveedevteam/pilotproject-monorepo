#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Configuration
const BASE_PORTS = {
  DB_PORT: 54322,
  API_PORT: 54321,
  STUDIO_PORT: 54323,
  INBUCKET_PORT: 54324,
};

const PROJECT_NAME_HASH_LENGTH = 4;

function generateProjectHash(projectName) {
  return crypto
    .createHash("md5")
    .update(projectName)
    .digest("hex")
    .substring(0, PROJECT_NAME_HASH_LENGTH);
}

function calculatePorts(projectName) {
  const hash = generateProjectHash(projectName);
  const offset = parseInt(hash, 16) % 1000; // Use modulo to keep offset reasonable

  return {
    DB_PORT: BASE_PORTS.DB_PORT + offset,
    API_PORT: BASE_PORTS.API_PORT + offset,
    STUDIO_PORT: BASE_PORTS.STUDIO_PORT + offset,
    INBUCKET_PORT: BASE_PORTS.INBUCKET_PORT + offset,
  };
}

function generateJWTSecret() {
  return crypto.randomBytes(32).toString("base64");
}

function generateAnonKey(jwtSecret) {
  // This is a simplified version - in production you'd use proper JWT library
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: "supabase",
      ref: "localhost",
      role: "anon",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 60 * 60, // 10 years
    })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", jwtSecret)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

function generateServiceRoleKey(jwtSecret) {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: "supabase",
      ref: "localhost",
      role: "service_role",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 60 * 60, // 10 years
    })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", jwtSecret)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

function createDockerOverride(projectName, ports) {
  const templatePath = path.join(
    __dirname,
    "../supabase/docker-compose.override.template.yml"
  );
  const overridePath = path.join(
    __dirname,
    "../supabase/docker-compose.override.yml"
  );

  if (!fs.existsSync(templatePath)) {
    throw new Error("Docker compose template not found");
  }

  let template = fs.readFileSync(templatePath, "utf8");

  // Replace placeholders
  template = template.replace(/\{\{PROJECT_NAME\}\}/g, projectName);
  template = template.replace(/\{\{DB_PORT\}\}/g, ports.DB_PORT);
  template = template.replace(/\{\{API_PORT\}\}/g, ports.API_PORT);
  template = template.replace(/\{\{STUDIO_PORT\}\}/g, ports.STUDIO_PORT);
  template = template.replace(/\{\{INBUCKET_PORT\}\}/g, ports.INBUCKET_PORT);

  fs.writeFileSync(overridePath, template);
  console.log(
    `✅ Created docker-compose.override.yml for project: ${projectName}`
  );
}

function createSupabaseEnv(projectName, ports) {
  const jwtSecret = generateJWTSecret();
  const anonKey = generateAnonKey(jwtSecret);
  const serviceRoleKey = generateServiceRoleKey(jwtSecret);

  const envContent = `# Supabase Environment Variables for ${projectName}
# Generated on ${new Date().toISOString()}

# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password
POSTGRES_DB=postgres

# JWT
JWT_SECRET=${jwtSecret}
JWT_EXPIRY=3600
ANON_KEY=${anonKey}
SERVICE_ROLE_KEY=${serviceRoleKey}

# API
PGRST_DB_SCHEMAS=public,storage,graphql_public

# Auth
DISABLE_SIGNUP=false
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false
ADDITIONAL_REDIRECT_URLS=

# Email (Inbucket for local development)
SMTP_ADMIN_EMAIL=admin@email.com
SMTP_HOST=inbucket
SMTP_PORT=2500
SMTP_USER=
SMTP_PASS=
SMTP_SENDER_NAME=

# Ports for ${projectName}
SUPABASE_DB_PORT=${ports.DB_PORT}
SUPABASE_API_PORT=${ports.API_PORT}
SUPABASE_STUDIO_PORT=${ports.STUDIO_PORT}
SUPABASE_INBUCKET_PORT=${ports.INBUCKET_PORT}
`;

  const envPath = path.join(__dirname, "../supabase/.env");
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Created .env file for project: ${projectName}`);
}

function createProjectConfig(projectName, ports) {
  const config = {
    projectName,
    created: new Date().toISOString(),
    ports,
    databaseUrl: `postgresql://postgres:your-super-secret-and-long-postgres-password@127.0.0.1:${ports.DB_PORT}/postgres`,
    apiUrl: `http://127.0.0.1:${ports.API_PORT}`,
    studioUrl: `http://127.0.0.1:${ports.STUDIO_PORT}`,
    inbucketUrl: `http://127.0.0.1:${ports.INBUCKET_PORT}`,
  };

  const configPath = path.join(__dirname, "../supabase.config.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`✅ Created supabase.config.json for project: ${projectName}`);
}

function updateWebEnv(projectName, ports) {
  const envContent = `# Next.js Environment Variables for ${projectName}
# Generated on ${new Date().toISOString()}

# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:${ports.API_PORT}
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQ1NjU0NzM2LCJleHAiOjE5NjEyMzA3MzZ9.tqMf7sNqnKqT4L-dNSJP2e0V8KW2U9P2x7U2w4JW2dU

# Database URL for server-side
DATABASE_URL=postgresql://postgres:your-super-secret-and-long-postgres-password@127.0.0.1:${ports.DB_PORT}/postgres

# Development
NODE_ENV=development
`;

  const webEnvPath = path.join(__dirname, "../apps/web/.env.local");
  fs.writeFileSync(webEnvPath, envContent);
  console.log(`✅ Created .env.local for web app`);
}

function updateDatabaseEnv(projectName, ports) {
  const envContent = `# Database Environment Variables for ${projectName}
# Generated on ${new Date().toISOString()}

DATABASE_URL=postgresql://postgres:your-super-secret-and-long-postgres-password@127.0.0.1:${ports.DB_PORT}/postgres
DIRECT_URL=postgresql://postgres:your-super-secret-and-long-postgres-password@127.0.0.1:${ports.DB_PORT}/postgres
`;

  const dbEnvPath = path.join(__dirname, "../packages/database/.env");
  fs.writeFileSync(dbEnvPath, envContent);
  console.log(`✅ Created .env for database package`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("❌ Usage: node setup-docker-project.js <project-name>");
    console.error("Example: node setup-docker-project.js my-app");
    process.exit(1);
  }

  const projectName = args[0].toLowerCase().replace(/[^a-z0-9-]/g, "-");

  if (projectName !== args[0]) {
    console.log(`📝 Project name normalized to: ${projectName}`);
  }

  try {
    console.log(`🚀 Setting up Supabase local environment for: ${projectName}`);

    const ports = calculatePorts(projectName);
    console.log(`📊 Assigned ports:`, ports);

    // Create all configuration files
    createDockerOverride(projectName, ports);
    createSupabaseEnv(projectName, ports);
    createProjectConfig(projectName, ports);
    updateWebEnv(projectName, ports);
    updateDatabaseEnv(projectName, ports);

    console.log(`\n🎉 Setup complete! Next steps:`);
    console.log(`1. Start Supabase: npm run supabase:start`);
    console.log(`2. Run migrations: npm run db:push`);
    console.log(`3. Start development: npm run dev`);
    console.log(`\n📍 Your services will be available at:`);
    console.log(`   - API: http://127.0.0.1:${ports.API_PORT}`);
    console.log(`   - Studio: http://127.0.0.1:${ports.STUDIO_PORT}`);
    console.log(`   - Database: 127.0.0.1:${ports.DB_PORT}`);
    console.log(`   - Inbucket: http://127.0.0.1:${ports.INBUCKET_PORT}`);
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  calculatePorts,
  generateProjectHash,
  createDockerOverride,
  createSupabaseEnv,
  createProjectConfig,
};
