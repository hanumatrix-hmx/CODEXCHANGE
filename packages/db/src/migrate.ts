import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as path from "path";

dotenv.config({ path: "../../.env.local" });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ DATABASE_URL is not set");
    process.exit(1);
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

async function runMigrate() {
    console.log("⏳ Running migrations...");

    const start = Date.now();

    try {
        await migrate(db, {
            migrationsFolder: path.resolve(__dirname, "../drizzle"),
        });

        const end = Date.now();

        console.log(`✅ Migrations completed in ${end - start}ms`);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    } finally {
        await client.end();
    }

    process.exit(0);
}

runMigrate();
