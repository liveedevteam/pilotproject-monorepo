import { readFileSync } from "fs";
import { join } from "path";
import { rawClient } from "../../core/client";

export interface SqlExecutionOptions {
  skipComments?: boolean;
  splitStatements?: boolean;
  handleDollarQuotes?: boolean;
}

export class SqlRunner {
  private client = rawClient;

  async executeFile(
    filePath: string,
    options: SqlExecutionOptions = {}
  ): Promise<void> {
    const {
      skipComments = true,
      splitStatements = true,
      handleDollarQuotes = true,
    } = options;

    try {
      console.log(`Executing SQL file: ${filePath}`);

      const sqlContent = readFileSync(filePath, "utf-8");

      if (splitStatements) {
        const statements = this.parseStatements(sqlContent, {
          skipComments,
          handleDollarQuotes,
        });

        for (const statement of statements) {
          if (statement.trim()) {
            console.log(`Executing: ${statement.substring(0, 60)}...`);
            await this.client.unsafe(statement);
          }
        }
      } else {
        await this.client.unsafe(sqlContent);
      }

      console.log(`Successfully executed: ${filePath}`);
    } catch (error) {
      console.error(`Error executing SQL file ${filePath}:`, error);
      throw error;
    }
  }

  async executeStatement(statement: string): Promise<void> {
    try {
      await this.client.unsafe(statement);
    } catch (error) {
      console.error("Error executing SQL statement:", error);
      throw error;
    }
  }

  private parseStatements(
    sqlContent: string,
    options: { skipComments: boolean; handleDollarQuotes: boolean }
  ): string[] {
    const statements = [];
    let currentStatement = "";
    let dollarQuoteCount = 0;

    const lines = sqlContent.split("\n");

    for (const line of lines) {
      // Skip comment lines if requested
      if (options.skipComments && line.trim().startsWith("--")) {
        continue;
      }

      currentStatement += line + "\n";

      // Count dollar quotes to handle function definitions
      if (options.handleDollarQuotes) {
        const dollarMatches = line.match(/\$\$/g);
        if (dollarMatches) {
          dollarQuoteCount += dollarMatches.length;
        }
      }

      // If we hit a semicolon and we're not inside a function definition
      if (
        line.includes(";") &&
        (!options.handleDollarQuotes || dollarQuoteCount % 2 === 0)
      ) {
        const statement = currentStatement.trim();
        if (statement.length > 0) {
          statements.push(statement);
        }
        currentStatement = "";
      }
    }

    // Add any remaining statement
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim());
    }

    return statements;
  }

  async transaction<T>(callback: (sql: any) => Promise<T>): Promise<T> {
    const result = await this.client.begin(async sql => {
      return await callback(sql);
    });
    return result as T;
  }
}
