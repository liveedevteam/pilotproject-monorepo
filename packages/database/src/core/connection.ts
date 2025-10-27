import postgres from "postgres";
import type { DatabaseConfig } from "./types";

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private connection: postgres.Sql | null = null;
  private config: DatabaseConfig;

  private constructor() {
    this.config = {
      connectionString: process.env.DATABASE_URL!,
      ssl: process.env.NODE_ENV === "production",
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "10"),
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || "30"),
    };
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getConnection(): postgres.Sql {
    if (!this.connection) {
      this.connection = postgres(this.config.connectionString, {
        max: this.config.maxConnections,
        idle_timeout: this.config.idleTimeout,
        ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
      });
    }
    return this.connection;
  }

  public async closeConnection(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }

  public getConfig(): DatabaseConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<DatabaseConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Force reconnection with new config
    if (this.connection) {
      this.closeConnection();
    }
  }
}

export const dbConnection = DatabaseConnection.getInstance();
export { DatabaseConnection };
