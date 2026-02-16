import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables from project root
const envPath = path.resolve(__dirname, "../../../.env.local");
console.log(`Loading env from: ${envPath}`);
dotenv.config({ path: envPath });

// Database connection
const connectionString = process.env.DATABASE_URL!;
console.log(`Connecting to database... ${connectionString ? 'URL is present' : 'URL IS MISSING'}`);
if (connectionString && !connectionString.includes('supabase.co')) {
    console.warn('Warning: Database URL does not look like a Supabase URL. Using:', connectionString);
}
const client = postgres(connectionString);

export const db = drizzle(client, { schema });

// Export all schema
export * from "./schema";
export * from "./queries";
export * from "./payment-queries";
