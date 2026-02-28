import { db } from "./index";
import { assets, licenses, reviews as reviewsTable, categories } from "./schema";
import { eq, and, desc, sql, count, countDistinct } from "drizzle-orm";

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
            tags: {
                with: {
                    tag: true,
                },
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
    const result = await db.query.assets.findMany({
        where: eq(assets.status as any, "pending_review"),
        with: {
            category: true,
            builder: true,
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

        const totalAssets = builderAssets.length;

        const approvedAssets = builderAssets.filter((a: any) => a.status === "approved").length;

        const totalSales = 0;
        const totalViews = 0;
        const totalRevenue = 0;
        const pendingPayout = 0;

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
                status: asset.status,
                viewsCount: 0,
                salesCount: 0,
                revenue: 0,
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
        const activeLicenses = totalLicenses;

        return {
            totalLicenses,
            activeLicenses,
            expiredLicenses: 0,
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
    await db
        .update(assets)
        .set({
            viewsCount: sql`${assets.viewsCount} + 1`,
        })
        .where(eq(assets.id, assetId));
}

/**
 * Get featured/latest approved assets for the landing page
 */
export async function getFeaturedAssets(limit = 6) {
    return db.query.assets.findMany({
        where: eq(assets.status, "approved"),
        with: { category: true },
        orderBy: [desc(assets.createdAt)],
        limit,
    });
}

/**
 * Get all categories (used for pills & icon grid on landing page)
 */
export async function getAllCategories() {
    return db.select().from(categories).orderBy(categories.name);
}

/**
 * Get marketplace-wide stats for the hero section
 */
export async function getMarketplaceStats() {
    const [toolsResult] = await db
        .select({ count: count() })
        .from(assets)
        .where(eq(assets.status, "approved"));

    const [buildersResult] = await db
        .select({ count: countDistinct(assets.builderId) })
        .from(assets)
        .where(eq(assets.status, "approved"));

    const [categoriesResult] = await db
        .select({ count: count() })
        .from(categories);

    return {
        totalTools: toolsResult?.count ?? 0,
        totalBuilders: buildersResult?.count ?? 0,
        totalCategories: categoriesResult?.count ?? 0,
    };
}
