import { MigrationRunner } from "./migrations/runners";

async function applyRLS() {
  const runner = new MigrationRunner();

  try {
    await runner.runSpecificScript("auth", "rls-policies");
    console.log("RLS policies applied successfully!");
  } catch (error) {
    console.error("Error applying RLS policies:", error);
    throw error;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  applyRLS()
    .then(() => {
      console.log("RLS setup completed successfully");
      process.exit(0);
    })
    .catch(error => {
      console.error("RLS setup failed:", error);
      process.exit(1);
    });
}
