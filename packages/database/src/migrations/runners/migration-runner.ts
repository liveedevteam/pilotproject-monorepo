import { join } from "path";
import { existsSync } from "fs";
import { SqlRunner } from "./sql-runner";

export interface MigrationOptions {
  domain?: string;
  scriptType?: "functions" | "rls-policies" | "triggers" | "indexes";
  force?: boolean;
}

export class MigrationRunner extends SqlRunner {
  private scriptsPath: string;

  constructor() {
    super();
    this.scriptsPath = join(__dirname, "../scripts");
  }

  async runDomainMigrations(
    domain: string,
    options: MigrationOptions = {}
  ): Promise<void> {
    const domainPath = join(this.scriptsPath, domain);

    if (!existsSync(domainPath)) {
      console.warn(`Domain scripts directory not found: ${domainPath}`);
      return;
    }

    console.log(`Running migrations for domain: ${domain}`);

    try {
      // Execute scripts in order
      const scriptOrder = [
        "functions.sql",
        "rls-policies.sql",
        "triggers.sql",
        "indexes.sql",
      ];

      for (const scriptFile of scriptOrder) {
        const scriptPath = join(domainPath, scriptFile);

        if (existsSync(scriptPath)) {
          await this.executeFile(scriptPath, {
            skipComments: true,
            splitStatements: true,
            handleDollarQuotes: true,
          });
        }
      }

      console.log(`Successfully completed migrations for domain: ${domain}`);
    } catch (error) {
      console.error(`Migration failed for domain ${domain}:`, error);
      throw error;
    }
  }

  async runSpecificScript(domain: string, scriptType: string): Promise<void> {
    const scriptPath = join(this.scriptsPath, domain, `${scriptType}.sql`);

    if (!existsSync(scriptPath)) {
      throw new Error(`Script not found: ${scriptPath}`);
    }

    await this.executeFile(scriptPath, {
      skipComments: true,
      splitStatements: true,
      handleDollarQuotes: scriptType === "functions",
    });
  }

  async runAllMigrations(): Promise<void> {
    console.log("Running all domain migrations...");

    const domains = ["auth", "users", "system"];

    for (const domain of domains) {
      try {
        await this.runDomainMigrations(domain);
      } catch (error) {
        console.error(`Failed to run migrations for domain ${domain}:`, error);
        throw error;
      }
    }

    console.log("All migrations completed successfully");
  }
}
