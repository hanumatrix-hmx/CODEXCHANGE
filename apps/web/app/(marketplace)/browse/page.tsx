import { db, categories } from "@codexchange/db";
import { AssetCard } from "@/components/asset-card";
import { CategoryFilter } from "@/components/category-filter";

export default async function BrowsePage({
    searchParams,
}: {
    searchParams: Promise<{ category?: string; tag?: string }>;
}) {
    const params = await searchParams;
    const categorySlug = params?.category;
    const tagSlug = params?.tag;

    // Fetch categories
    const allCategories = await db.select().from(categories);

    // Get asset IDs for tag if provided
    let tagAssetIds: string[] | undefined;

    if (tagSlug) {
        // Find tag by name
        const tagRecord = await db.query.tags.findFirst({
            where: (tags, { eq }) => eq(tags.name, tagSlug),
        });

        if (tagRecord) {
            // Get all asset IDs with this tag
            const listings = await db.query.listingTags.findMany({
                where: (lt, { eq }) => eq(lt.tagId, tagRecord.id),
            });
            tagAssetIds = listings.map(l => l.assetId);
        } else {
            // Tag not found, so no assets
            tagAssetIds = [];
        }
    }

    // Fetch assets (filtered)
    let query = db.query.assets.findMany({
        with: {
            category: true,
        },
        where: (assets, { eq, and, inArray, sql }) => {
            const conditions = [];

            if (categorySlug) {
                const categoryId = allCategories.find((c) => c.slug === categorySlug)?.id;
                if (categoryId) {
                    conditions.push(eq(assets.categoryId, categoryId));
                } else {
                    // Invalid category, return no results
                    conditions.push(sql`1 = 0`);
                }
            }

            if (tagAssetIds !== undefined) {
                if (tagAssetIds.length > 0) {
                    conditions.push(inArray(assets.id, tagAssetIds));
                } else {
                    conditions.push(sql`1 = 0`);
                }
            }

            return and(...conditions);
        },
    });

    const allAssets = await query;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CategoryFilter categories={allCategories as any[]} />

                {tagSlug && (
                    <div className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                        <span>Tag: <strong>{tagSlug}</strong></span>
                        <a href="/browse" className="ml-1 rounded-full p-0.5 hover:bg-blue-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </a>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {allAssets.map((asset) => (
                    <AssetCard key={asset.id} asset={asset as any} />
                ))}
                {allAssets.length === 0 && (
                    <div className="col-span-full py-16 text-center">
                        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No assets found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            We couldn&apos;t find any assets matching your criteria.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
