import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { categories } from "./schema";

// Load environment variables FIRST
dotenv.config({ path: "../../.env.local" });

const defaultCategories = [
    { name: "AI Agents", slug: "ai-agents", description: "Autonomous AI agents and assistants" },
    { name: "Coding Assistants", slug: "coding-assistants", description: "AI tools to help write code" },
    { name: "Connectors", slug: "connectors", description: "API connectors and integrations" },
    { name: "Customer Support", slug: "support", description: "AI chatbots and support systems" },
    { name: "Data Tools", slug: "data-tools", description: "Data processing and analysis utilities" },
    { name: "Datasets", slug: "datasets", description: "Curated datasets for AI training" },
    { name: "Finance AI", slug: "finance", description: "AI for financial analysis and trading" },
    { name: "Image Generation", slug: "image-gen", description: "Tools for creating image assets" },
    { name: "LLMs", slug: "llms", description: "Large Language Models for text generation" },
    { name: "Marketing Automation", slug: "marketing", description: "Tools for automating marketing workflows" },
    { name: "Plugins", slug: "plugins", description: "Extensions and plugins for popular tools" },
    { name: "Productivity", slug: "productivity", description: "Tools to enhance workflow efficiency" },
    { name: "Source Code", slug: "source-code", description: "Production-ready source code and boilerplates" },
    { name: "Templates", slug: "templates", description: "Project templates and starter kits" },
    { name: "Utilities", slug: "utilities", description: "Developer tools and utilities" },
    { name: "Voice AI", slug: "voice-ai", description: "Text-to-speech and speech-to-text models" },
];

async function seed() {
    console.log("🌱 Seeding database...");

    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL not found in environment variables");
        console.error("Make sure .env.local exists in the root directory");
        process.exit(1);
    }

    console.log("📡 Connecting to:", process.env.DATABASE_URL.split("@")[1]?.split("/")[0] || "database");

    const client = postgres(process.env.DATABASE_URL);
    const db = drizzle(client, { schema: { categories } });

    try {
        let seeded = 0;
        let skipped = 0;

        console.log("\n📂 Seeding categories...");
        for (const cat of defaultCategories) {
            const result = await db
                .insert(categories)
                .values(cat)
                .onConflictDoNothing()
                .returning();
            if (result.length > 0) {
                console.log(`  ✅ Added: ${cat.name}`);
                seeded++;
            } else {
                console.log(`  ⏭️  Skipped (already exists): ${cat.name}`);
                skipped++;
            }
        }

        console.log(`\n🎉 Seed complete! ${seeded} added, ${skipped} already existed.`);
    } catch (error) {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    } finally {
        await client.end();
    }

    process.exit(0);
}

seed();
