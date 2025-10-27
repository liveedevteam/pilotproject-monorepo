import type { DatabaseConfig } from "../../src/core/types";

export const testConfig: DatabaseConfig = {
  connectionString:
    process.env.TEST_DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:54323/postgres_test",
  ssl: false,
  maxConnections: 5,
  idleTimeout: 10,
};

export const testDrizzleConfig = {
  dialect: "postgresql" as const,
  schema: "./src/schemas/*",
  out: "./drizzle-test",
  dbCredentials: {
    url: testConfig.connectionString,
  },
  verbose: false,
  strict: true,
};
