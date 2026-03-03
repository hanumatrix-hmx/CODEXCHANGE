import { Suspense } from "react";
import Link from "next/link";
import { db, categories } from "@codexchange/db";
import { AssetCard } from "@/components/asset-card";
import { SearchAndFilter } from "@/components/browse/search-and-filter";
import { ChevronRight, SearchX } from "lucide-react";

export default async function BrowsePage({
    searchParams,
}: {
    searchParams: Promise<{ category?: string; tag?: string; search?: string; sort?: string; page?: string }>;
}) {
    const params = await searchParams;
    const categorySlug = params?.category;
    const tagSlug = params?.tag;
    const search = params?.search;
    const sort = params?.sort || "newest";
    const page = parseInt(params?.page || "1", 10);
    const itemsToShow = page * 12;

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

    // Fetch assets (filtered by category/tag to limit db load)
    let query = db.query.assets.findMany({
        with: {
            category: true,
            builder: true,
        },
        where: (assets, { eq, and, inArray, sql }) => {
            const conditions = [];

            if (categorySlug && categorySlug !== "all") {
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

            return conditions.length > 0 ? and(...conditions) : undefined;
        },
    });

    let allAssets = await query;

    // Apply search filter locally to ensure safety across dialects
    if (search) {
        const queryTerm = search.toLowerCase();
        allAssets = allAssets.filter(
            a =>
                a.name.toLowerCase().includes(queryTerm) ||
                (a.description || "").toLowerCase().includes(queryTerm)
        );
    }

    // Apply sorting
    if (sort === "price_asc") {
        allAssets.sort((a, b) => Number(a.usageLicensePrice || 0) - Number(b.usageLicensePrice || 0));
    } else if (sort === "price_desc") {
        allAssets.sort((a, b) => Number(b.usageLicensePrice || 0) - Number(a.usageLicensePrice || 0));
    } else if (sort === "popular") {
        allAssets.sort((a, b) => Number(b.viewsCount || 0) - Number(a.viewsCount || 0));
    } else {
        // default to "newest" by reversing since query returns in default insertion order (oldest first)
        allAssets.reverse();
    }

    // Pagination (Load More pattern)
    const hasNextPage = allAssets.length > itemsToShow;
    const paginatedAssets = allAssets.slice(0, itemsToShow);

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="flex flex-col gap-6 pt-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Discover Assets
                    </h1>
                    <p className="mt-2 text-slate-500 dark:text-slate-400 w-full max-w-2xl">
                        Browse our marketplace of high-quality components, templates, and AI agents.
                    </p>
                </div>

                <Suspense fallback={<div className="h-14 w-full animate-pulse bg-slate-100 dark:bg-slate-800 rounded-2xl" />}>
                    <SearchAndFilter categories={allCategories as any[]} />
                </Suspense>
            </div>

            {tagSlug && (
                <div className="flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 text-sm text-indigo-700 dark:text-indigo-300 w-max">
                    <span>Tag: <strong className="font-semibold">{tagSlug}</strong></span>
                    <Link href="/browse" className="ml-1 rounded-full p-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </Link>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {paginatedAssets.map((asset) => (
                    <AssetCard key={asset.id} asset={asset as any} variant="dark" layout="vertical" />
                ))}

                {paginatedAssets.length === 0 && (
                    <div className="col-span-full py-24 text-center border rounded-2xl border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                        <div className="mx-auto h-12 w-12 text-slate-400 mb-4 flex justify-center items-center rounded-full bg-slate-100 dark:bg-slate-800">
                            <SearchX className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No assets found</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                            We couldn&apos;t find any assets matching your filters. Try adjusting your search query or categories.
                        </p>
                    </div>
                )}
            </div>

            {hasNextPage && (
                <div className="flex items-center justify-center pt-8">
                    <Link
                        href={`/browse?${new URLSearchParams({
                            ...(search ? { search } : {}),
                            ...(categorySlug && categorySlug !== "all" ? { category: categorySlug } : {}),
                            ...(sort !== "newest" ? { sort } : {}),
                            ...(tagSlug ? { tag: tagSlug } : {}),
                            page: (page + 1).toString()
                        })}`}
                        scroll={false}
                        className="px-8 py-3 text-base font-semibold rounded-2xl shadow-lg shadow-indigo-500/20 text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-950 focus:ring-indigo-500 transition-all duration-300 flex items-center gap-2"
                    >
                        Load More Assets
                        <ChevronRight className="h-5 w-5" />
                    </Link>
                </div>
            )}
        </div>
    );
}
