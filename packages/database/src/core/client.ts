import { drizzle } from "drizzle-orm/postgres-js";
import { dbConnection } from "./connection";
import * as schema from "../schemas";
import type { Database } from "./types";

// Get the postgres connection
const client = dbConnection.getConnection();

// Create the Drizzle database instance
export const db: Database = drizzle(client, { schema });

// Export the raw client for direct SQL operations if needed
export const rawClient = client;

// Utility function to close the database connection
export const closeDatabase = async (): Promise<void> => {
  await dbConnection.closeConnection();
};
