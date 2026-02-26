import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables from project root
const envPath = path.resolve(__dirname, "../../../.env.local");
dotenv.config({ path: envPath });

// Database connection
const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set.");
}
const client = postgres(connectionString);

export const db = drizzle(client, { schema });

// Export all schema
export * from "./schema";
export * from "./queries";
export * from "./payment-queries";
