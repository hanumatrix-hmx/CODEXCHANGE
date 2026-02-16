import { getAssetBySlug } from "./queries";

async function testAssetQuery() {
    try {
        console.log("🔍 Testing asset query for 'autogpt-pro'...");

        const asset = await getAssetBySlug("autogpt-pro");

        if (asset) {
            console.log("✅ Asset found!");
            console.log(`   Name: ${asset.name}`);
            console.log(`   Category: ${asset.category?.name}`);
            console.log(`   Builder: ${asset.builder?.email}`);
            console.log(`   Reviews: ${asset.reviews?.length || 0}`);
        } else {
            console.log("❌ Asset not found");
        }
    } catch (error) {
        console.error("❌ Error querying asset:");
        console.error(error);
        process.exit(1);
    }
}

testAssetQuery();
