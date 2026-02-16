import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { categories } from "./schema";

// Load environment variables FIRST
dotenv.config({ path: "../../.env.local" });

async function seed() {
    console.log("🌱 Seeding database...");

    // Verify DATABASE_URL is loaded
    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL not found in environment variables");
        console.error("Make sure .env.local exists in the root directory");
        process.exit(1);
    }

    console.log("📡 Connecting to:", process.env.DATABASE_URL.split("@")[1]?.split("/")[0] || "database");

    // Create database connection AFTER env vars are loaded
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    const db = drizzle(client, { schema: { categories } });

    try {
        // Create sample categories
        const insertedCategories = await db
            .insert(categories)
            .values([
                {
                    name: "AI Tools",
                    slug: "ai-tools",
                    description: "Artificial Intelligence and Machine Learning tools",
                },
                {
                    name: "Web Development",
                    slug: "web-development",
                    description: "Web development frameworks and tools",
                },
            ])
            .returning();

        console.log("✅ Categories created:", insertedCategories.length);
        console.log("🎉 Seed completed successfully!");
    } catch (error) {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    } finally {
        await client.end();
    }

    process.exit(0);
}

seed();
