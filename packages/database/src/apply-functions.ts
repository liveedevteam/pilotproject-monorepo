import { MigrationRunner } from "./migrations/runners";

async function applyFunctions() {
  const runner = new MigrationRunner();

  try {
    await runner.runSpecificScript("auth", "functions");
    console.log("Database helper functions applied successfully!");
  } catch (error) {
    console.error("Error applying database functions:", error);
    throw error;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  applyFunctions()
    .then(() => {
      console.log("Database functions setup completed successfully");
      process.exit(0);
    })
    .catch(error => {
      console.error("Database functions setup failed:", error);
      process.exit(1);
    });
}
