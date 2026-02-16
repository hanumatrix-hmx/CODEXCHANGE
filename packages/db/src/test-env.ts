import * as dotenv from "dotenv";
import * as path from "path";

console.log("Current working directory:", process.cwd());
const envPath = path.resolve(process.cwd(), "../../.env.local");
console.log("Looking for .env.local at:", envPath);

dotenv.config({ path: envPath });

console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Exists (hidden)" : "Missing");
console.log("DIRECT_URL:", process.env.DIRECT_URL ? "Exists (hidden)" : "Missing");
