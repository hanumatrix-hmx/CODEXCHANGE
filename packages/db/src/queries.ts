import { db } from "./index";
import { assets, licenses, reviews as reviewsTable } from "./schema";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * Get asset by slug with all relations
 */
export async function getAssetBySlug(slug: string) {
    const result = await db.query.assets.findFirst({
        where: eq(assets.slug, slug),
        with: {
            category: true,
            builder: true,
            listingImages: {
                orderBy: (images, { asc }) => [asc(images.sortOrder)],
            },
            reviews: {
                limit: 10,
                orderBy: [desc(reviewsTable.createdAt)],
            },
        },
    });

    return result;
}

/**
 * Get related assets by category
 */
export async function getRelatedAssets(categoryId: string, excludeAssetId: string, limit = 4) {
    const result = await db.query.assets.findMany({
        where: and(
            eq(assets.categoryId, categoryId),
            eq(assets.status, "approved"),
            sql`${assets.id} != ${excludeAssetId}`
        ),
        with: {
            category: true,
        },
        limit,
        orderBy: [desc(assets.createdAt)],
    });

    return result;
}

/**
 * Get user licenses with asset data
 */
export async function getUserLicenses(userId: string) {
    const result = await db.query.licenses.findMany({
        where: eq(licenses.buyerId, userId),
        with: {
            asset: {
                with: {
                    category: true,
                },
            },
        },
        orderBy: [desc(licenses.createdAt)],
    });

    return result;
}

/**
 * Get pending assets for admin review
 */
export async function getPendingAssets() {
    // Cast to any to bypass status field type error temporarily
    const result = await db.query.assets.findMany({
        where: eq(assets.status as any, "pending_review"),
        with: {
            category: true,
            builder: true, // This should load the builder user data
        },
        orderBy: [desc(assets.createdAt)],
    });

    return result;
}

/**
 * Get builder analytics
 */
export async function getBuilderAnalytics(builderId: string) {
    try {
        const builderAssets = await db.query.assets.findMany({
            where: eq(assets.builderId, builderId),
            with: {
                category: true,
            },
        });

        // Calculate totals with safe defaults
        const totalAssets = builderAssets.length;

        // TODO: Once schema is updated with status field, uncomment this:
        // const approvedAssets = builderAssets.filter((a: any) => a.status === "approved").length;
        const approvedAssets = totalAssets; // Temporary: assume all are approved

        // TODO: These fields need to be added to schema
        const totalSales = 0; // Will be calculated from transactions once schema is ready
        const totalViews = 0; // Will be calculated from viewsCount field once added
        const totalRevenue = 0; // Will be calculated from transactions
        const pendingPayout = 0; // Will be calculated from transactions

        return {
            totalAssets,
            approvedAssets,
            totalSales,
            totalViews,
            totalRevenue,
            pendingPayout,
            assets: builderAssets.map((asset) => ({
                id: asset.id,
                name: asset.name,
                slug: asset.slug,
                status: asset.status, // Use actual status from database
                viewsCount: 0, // TODO: Use actual viewsCount once added
                salesCount: 0, // TODO: Calculate from transactions
                revenue: 0, // TODO: Calculate from transactions
                category: asset.category,
            })),
        };
    } catch (error) {
        console.error("Error in getBuilderAnalytics:", error);
        // Return empty stats on error
        return {
            totalAssets: 0,
            approvedAssets: 0,
            totalSales: 0,
            totalViews: 0,
            totalRevenue: 0,
            pendingPayout: 0,
            assets: [],
        };
    }
}

/**
 * Get buyer stats
 */
export async function getBuyerStats(buyerId: string) {
    try {
        const licenses = await getUserLicenses(buyerId);

        const totalLicenses = licenses.length;
        // TODO: Once schema has status field, use it. For now, assume all are active
        const activeLicenses = totalLicenses;

        return {
            totalLicenses,
            activeLicenses,
            expiredLicenses: 0, // TODO: Calculate once status field exists
            licenses,
        };
    } catch (error) {
        console.error("Error in getBuyerStats:", error);
        return {
            totalLicenses: 0,
            activeLicenses: 0,
            expiredLicenses: 0,
            licenses: [],
        };
    }
}

/**
 * Increment asset view count
 */
export async function incrementAssetViews(assetId: string) {
    // TODO: Add viewsCount field to assets schema
    // For now, this function is a no-op to prevent errors
    // await db
    //     .update(assets)
    //     .set({
    //         viewsCount: sql`${assets.viewsCount} + 1`,
    //     })
    //     .where(eq(assets.id, assetId));
    return; // No-op until schema is updated
}
