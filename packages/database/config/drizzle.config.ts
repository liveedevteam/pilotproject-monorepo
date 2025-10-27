import type { Config } from "drizzle-kit";
import { getDrizzleConfig } from "./index";

export default getDrizzleConfig() satisfies Config;
