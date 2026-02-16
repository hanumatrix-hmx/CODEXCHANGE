import { db, categories } from "@codexchange/db";
import { AssetCard } from "@/components/asset-card";
import { CategoryFilter } from "@/components/category-filter";

export default async function BrowsePage({
    searchParams,
}: {
    searchParams: Promise<{ category?: string }>;
}) {
    const params = await searchParams;
    const categorySlug = params?.category;

    // Fetch categories
    const allCategories = await db.select().from(categories);

    // Fetch assets (filtered)
    let query = db.query.assets.findMany({
        with: {
            category: true,
        },
        // Only if category is selected
        where: categorySlug
            ? (assets, { eq }) =>
                eq(
                    assets.categoryId,
                    allCategories.find((c) => c.slug === categorySlug)?.id || "invalid"
                )
            : undefined,
    });

    const allAssets = await query;

    return (
        <div>
            <CategoryFilter categories={allCategories as any[]} />

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
                            We couldn't find any assets matching your criteria.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
