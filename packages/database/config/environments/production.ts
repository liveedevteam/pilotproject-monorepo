import type { DatabaseConfig } from "../../src/core/types";

export const productionConfig: DatabaseConfig = {
  connectionString: process.env.DATABASE_URL!,
  ssl: true,
  maxConnections: 30,
  idleTimeout: 60,
};

export const productionDrizzleConfig = {
  dialect: "postgresql" as const,
  schema: "./src/schemas/*",
  out: "./drizzle",
  dbCredentials: {
    url: productionConfig.connectionString,
  },
  verbose: false,
  strict: true,
};
