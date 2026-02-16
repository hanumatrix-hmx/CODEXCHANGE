import { db } from "./index";

async function testConnection() {
    try {
        console.log("🔍 Testing database connection...");

        // Test categories
        const categories = await db.query.categories.findMany({ limit: 5 });
        console.log(`✅ Found ${categories.length} categories`);

        // Test assets
        const assets = await db.query.assets.findMany({
            limit: 5,
            with: {
                category: true,
                builder: true,
            }
        });
        console.log(`✅ Found ${assets.length} assets`);

        if (assets.length > 0) {
            console.log("\n📦 Sample asset:");
            console.log(`   Name: ${assets[0].name}`);
            console.log(`   Slug: ${assets[0].slug}`);
            console.log(`   Category: ${assets[0].category?.name}`);
            console.log(`   Builder: ${assets[0].builder?.email}`);
        }

        console.log("\n✅ Database connection test successful!");
    } catch (error) {
        console.error("❌ Database connection test failed:");
        console.error(error);
        process.exit(1);
    }
}

testConnection();
