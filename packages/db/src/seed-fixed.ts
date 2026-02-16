import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { categories, assets, profiles } from "./schema";
import { eq } from "drizzle-orm";

// Load environment variables
dotenv.config({ path: "../../.env.local" });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ DATABASE_URL is not set");
    process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
    console.log("🌱 Seeding database...");

    try {
        // 1. Create Categories
        console.log("Creating categories...");
        const categoryData = [
            {
                name: "AI Agents",
                slug: "ai-agents",
                description: "Autonomous agents for various tasks",
            },
            {
                name: "LLMs",
                slug: "llms",
                description: "Large Language Models for text generation",
            },
            {
                name: "Voice AI",
                slug: "voice-ai",
                description: "Text-to-speech and speech-to-text models",
            },
            {
                name: "Image Generation",
                slug: "image-gen",
                description: "Tools for creating image assets",
            },
            {
                name: "Data Tools",
                slug: "data-tools",
                description: "Data processing and analysis utilities",
            },
            {
                name: "Coding Assistants",
                slug: "coding-assistants",
                description: "AI tools to help write code",
            },
            {
                name: "Marketing Automation",
                slug: "marketing",
                description: "Tools for automating marketing workflows",
            },
            {
                name: "Customer Support",
                slug: "support",
                description: "AI chatbots and support systems",
            },
            {
                name: "Productivity",
                slug: "productivity",
                description: "Tools to enhance workflow efficiency",
            },
            {
                name: "Finance AI",
                slug: "finance",
                description: "AI for financial analysis and trading",
            },
        ];

        // Upsert categories
        for (const cat of categoryData) {
            await db
                .insert(categories)
                .values(cat)
                .onConflictDoUpdate({
                    target: categories.slug,
                    set: cat,
                });
        }
        console.log("✅ Categories seeded");

        // 2. Create a Dummy Seller Profile (if not exists)
        // We'll check if a profile exists, if not create one using raw SQL to bypass foreign key constraints on auth.users if needed,
        // but better to rely on existing users or create a mock one properly linked to auth.users if possible.
        // For simplicity in development, we might not have a user yet.
        // Let's assume the user viewing this has created an account (me).
        // I will fetch the first available profile to use as the "seller".

        const allProfiles = await db.select().from(profiles).limit(1);
        let sellerId = allProfiles[0]?.id;

        if (!sellerId) {
            console.warn("⚠️ No profiles found. Assets will be created without a specific owner (or fail if not nullable).");
            // If assets.developerId is required, we might fail here.
            // Let's check schema/index.ts or schema.ts... assuming it's required.
            // We will try to create a dummy user in auth.users first? No, that's hard from here.
            // We'll skip asset creation if no user, or assume the user has signed up as per previous steps.
            console.log("Please sign up in the app first to have a valid user ID for assets.");
            // We can insert a dummy profile if we know a valid UUID, but it needs to exist in auth.users normally.
            // For now, let's proceed and see.
        }

        if (sellerId) {
            // 3. Create Sample Assets
            console.log("Creating assets...");

            const aiAgentsCat = await db.query.categories.findFirst({
                where: eq(categories.slug, "ai-agents"),
            });
            const voiceCat = await db.query.categories.findFirst({
                where: eq(categories.slug, "voice-ai"),
            });

            const assetData = [
                {
                    name: "AutoGPT Pro",
                    slug: "autogpt-pro",
                    description: "Advanced autonomous AI agent for complex task execution.",
                    builderId: sellerId,
                    categoryId: aiAgentsCat?.id,
                    usageLicensePrice: "49.99",
                    thumbnailUrl: "https://placehold.co/600x400/2563eb/white?text=AutoGPT+Pro",
                    status: "approved",
                },
                {
                    name: "VoiceClone X",
                    slug: "voiceclone-x",
                    description: "High-fidelity voice cloning software for content creators.",
                    builderId: sellerId,
                    categoryId: voiceCat?.id,
                    usageLicensePrice: "29.99",
                    thumbnailUrl: "https://placehold.co/600x400/db2777/white?text=VoiceClone+X",
                    status: "approved",
                },
                {
                    name: "CodeWizard AI",
                    slug: "codewizard-ai",
                    description: "Intelligent code completion and refactoring assistant.",
                    builderId: sellerId,
                    categoryId: aiAgentsCat?.id,
                    usageLicensePrice: "0.00",
                    thumbnailUrl: "https://placehold.co/600x400/16a34a/white?text=CodeWizard",
                    status: "approved",
                },
                {
                    name: "DataAnalyst 3000",
                    slug: "data-analyst-3000",
                    description: "Automated data cleaning and visualization tool.",
                    builderId: sellerId,
                    categoryId: aiAgentsCat?.id,
                    usageLicensePrice: "99.00",
                    thumbnailUrl: "https://placehold.co/600x400/9333ea/white?text=DataAnalyst",
                    status: "approved",
                }
            ];

            for (const asset of assetData) {
                if (!asset.categoryId) continue;

                await db
                    .insert(assets)
                    .values(asset as any) // Type casting as schema might vary slightly
                    .onConflictDoUpdate({
                        target: assets.slug,
                        set: asset as any,
                    });
            }
            console.log("✅ Assets seeded");
        }

        console.log("🎉 Seed completed successfully!");
    } catch (error) {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

seed();
