import { db } from "./index";
import { assets, licenses, reviews as reviewsTable, categories } from "./schema";
import { eq, and, desc, sql, count } from "drizzle-orm";

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
 * Full-text search for assets
 */
export async function searchAssets(params: {
    query: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    sort: "relevance" | "newest" | "price_asc" | "price_desc" | "popular";
    limit: number;
    offset: number;
}) {
    // We use raw SQL for the search and ranking because Drizzle ORM does not yet have 
    // first-class support for plainto_tsquery, ts_rank, and tsvector operators.

    // Base CTE to calculate the effective minimum price and rank
    let sqlQuery = sql`
        WITH search_results AS (
            SELECT 
                a.*,
                LEAST(COALESCE(a.usage_license_price, 999999), COALESCE(a.source_license_price, 999999)) as effective_price,
                ts_rank(a.search_vector, plainto_tsquery('english', ${params.query})) as rank
            FROM assets a
            WHERE a.status = 'approved'
            AND a.search_vector @@ plainto_tsquery('english', ${params.query})
    `;

    // Apply category filter
    if (params.categoryId) {
        sqlQuery = sql`${sqlQuery} AND a.category_id = ${params.categoryId}`;
    }

    // Apply price filters
    if (params.minPrice !== undefined) {
        sqlQuery = sql`${sqlQuery} AND LEAST(COALESCE(a.usage_license_price, 999999), COALESCE(a.source_license_price, 999999)) >= ${params.minPrice}`;
    }
    if (params.maxPrice !== undefined) {
        sqlQuery = sql`${sqlQuery} AND LEAST(COALESCE(a.usage_license_price, 999999), COALESCE(a.source_license_price, 999999)) <= ${params.maxPrice}`;
    }

    sqlQuery = sql`${sqlQuery} )
        SELECT 
            sr.*,
            json_build_object(
                'id', p.id,
                'full_name', p.full_name,
                'avatar_url', p.avatar_url
            ) as builder,
            json_build_object(
                'id', c.id,
                'name', c.name,
                'slug', c.slug
            ) as category,
            COUNT(*) OVER() as total_count
        FROM search_results sr
        LEFT JOIN profiles p ON p.id = sr.builder_id
        LEFT JOIN categories c ON c.id = sr.category_id
    `;

    // Apply sorting
    switch (params.sort) {
        case "newest":
            sqlQuery = sql`${sqlQuery} ORDER BY sr.created_at DESC`;
            break;
        case "price_asc":
            sqlQuery = sql`${sqlQuery} ORDER BY sr.effective_price ASC, sr.rank DESC`;
            break;
        case "price_desc":
            sqlQuery = sql`${sqlQuery} ORDER BY sr.effective_price DESC, sr.rank DESC`;
            break;
        case "popular":
            sqlQuery = sql`${sqlQuery} ORDER BY sr.sold_licenses DESC, sr.rank DESC`;
            break;
        case "relevance":
        default:
            sqlQuery = sql`${sqlQuery} ORDER BY sr.rank DESC, sr.created_at DESC`;
            break;
    }

    // Apply pagination
    sqlQuery = sql`${sqlQuery} LIMIT ${params.limit} OFFSET ${params.offset}`;

    const rows = await db.execute(sqlQuery) as any[];

    const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

    // Clean up the total_count property from the results before returning
    const assets = rows.map((row: any) => {
        const { total_count, rank, search_vector, effective_price, ...assetData } = row;

        // Map snake_case back to camelCase manually since we used raw SQL
        return {
            id: assetData.id,
            builderId: assetData.builder_id,
            categoryId: assetData.category_id,
            name: assetData.name,
            slug: assetData.slug,
            description: assetData.description,
            longDescription: assetData.long_description,
            usageLicensePrice: assetData.usage_license_price,
            sourceLicensePrice: assetData.source_license_price,
            maxLicenses: assetData.max_licenses,
            soldLicenses: assetData.sold_licenses,
            qualityTier: assetData.quality_tier,
            status: assetData.status,
            viewsCount: assetData.views_count,
            techStack: assetData.tech_stack,
            demoUrl: assetData.demo_url,
            githubUrl: assetData.github_url,
            licenseFeatures: assetData.license_features,
            thumbnailUrl: assetData.thumbnail_url,
            fileStoragePath: assetData.file_storage_path,
            avgRating: assetData.avg_rating,
            totalReviews: assetData.total_reviews,
            createdAt: assetData.created_at,
            updatedAt: assetData.updated_at,
            builder: assetData.builder ? {
                id: assetData.builder.id,
                fullName: assetData.builder.full_name,
                avatarUrl: assetData.builder.avatar_url
            } : null,
            category: assetData.category,
        };
    });

    return {
        assets,
        total,
    };
}


/**
 * Get all categories with approved asset counts
 */
export async function getAllCategoriesWithCount() {
    const results = await db
        .select({
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
            description: categories.description,
            assetCount: count(assets.id),
        })
        .from(categories)
        .leftJoin(
            assets,
            and(
                eq(categories.id, assets.categoryId),
                eq(assets.status, "approved")
            )
        )
        .groupBy(categories.id, categories.name, categories.slug, categories.description)
        .orderBy(categories.name);

    return results;
}
