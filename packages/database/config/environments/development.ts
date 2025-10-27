import type { DatabaseConfig } from "../../src/core/types";

export const developmentConfig: DatabaseConfig = {
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:54322/postgres",
  ssl: false,
  maxConnections: 20,
  idleTimeout: 30,
};

export const developmentDrizzleConfig = {
  dialect: "postgresql" as const,
  schema: "./src/schemas/*",
  out: "./drizzle",
  dbCredentials: {
    url: developmentConfig.connectionString,
  },
  verbose: true,
  strict: true,
};
