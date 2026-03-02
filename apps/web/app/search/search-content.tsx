"use client";

import { useSearchParams } from "next/navigation";
import { api } from "@/utils/trpc/client";
import { SearchFilters } from "@/components/search-filters";
import { AssetCard, Asset } from "@/components/asset-card";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { keepPreviousData } from "@tanstack/react-query";

export function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const query = searchParams.get("q") || "";
    const categorySlugs = searchParams.getAll("category");
    const minPriceStr = searchParams.get("minPrice");
    const maxPriceStr = searchParams.get("maxPrice");
    const sort = (searchParams.get("sort") as any) || "relevance";
    const offsetStr = searchParams.get("offset");

    const minPrice = minPriceStr ? parseFloat(minPriceStr) : undefined;
    const maxPrice = maxPriceStr ? parseFloat(maxPriceStr) : undefined;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
    const limit = 20;

    // We maintain a local array of accumulated assets for pagination
    const [allAssets, setAllAssets] = useState<Asset[]>([]);

    // We also track the current total from the DB to know when to disable the button
    const [totalCount, setTotalCount] = useState<number>(0);

    const { data, isLoading, isFetching } = api.asset.search.useQuery(
        {
            query,
            categorySlug: categorySlugs.length > 0 ? categorySlugs : undefined,
            minPrice,
            maxPrice,
            sort,
            limit,
            offset,
        },
        {
            placeholderData: keepPreviousData,
        }
    );

    // Sync data to allAssets based on offset logic
    useEffect(() => {
        if (!data) return;

        if (offset === 0) {
            // First page or filters changed
            setAllAssets(data.assets as any[]);
        } else {
            // Processing a "load more" fetch
            setAllAssets((prev) => {
                // To avoid duplicate appends on double fires, check if the first item already exists
                const newAssets = data.assets as any[];
                if (newAssets.length === 0) return prev;

                // Keep the old list, append any new ids we haven't seen.
                const existingMap = new Map(prev.map(a => [a.id, a]));
                const uniqueNewAssets = newAssets.filter(a => !existingMap.has(a.id));
                return [...prev, ...uniqueNewAssets];
            });
        }
        setTotalCount(data.total);
    }, [data, offset]);

    const handleLoadMore = useCallback(() => {
        const nextOffset = offset + limit;
        const params = new URLSearchParams(searchParams.toString());
        params.set("offset", nextOffset.toString());
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [offset, limit, searchParams, router, pathname]);

    const hasMore = allAssets.length < totalCount;

    return (
        <div className="flex flex-col md:flex-row gap-8 w-full">
            {/* Sidebar Filters */}
            <aside className="w-full md:w-1/4 shrink-0">
                <div className="sticky top-24">
                    <SearchFilters />
                </div>
            </aside>

            {/* Main Results Area */}
            <div className="w-full md:w-3/4">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        {query ? (
                            <>
                                {totalCount} results for &quot;<span className="bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">{query}</span>&quot;
                            </>
                        ) : (
                            <>{totalCount} results</>
                        )}
                    </h1>
                </div>

                {/* Loading State or No Results */}
                {isLoading && allAssets.length === 0 ? (
                    <div className="flex justify-center items-center h-64 border border-slate-200/50 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-2xl shadow-sm">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 dark:text-indigo-400" />
                        <span className="ml-3 text-slate-500 dark:text-slate-400 font-medium">Loading results...</span>
                    </div>
                ) : allAssets.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-64 border border-slate-200/50 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-2xl shadow-sm">
                        <div className="flex bg-slate-100/50 dark:bg-white/5 p-4 rounded-full mb-4 shadow-sm">
                            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No results found</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 text-center max-w-md">
                            We couldn&apos;t find any assets matching your criteria. Try adjusting your filters or search query.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {allAssets.map((asset) => (
                                <AssetCard key={asset.id} asset={asset} variant="dark" />
                            ))}
                        </div>

                        {/* Load More Button */}
                        {hasMore && (
                            <div className="mt-12 flex justify-center">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={isFetching}
                                    className="px-8 py-3 text-base font-semibold rounded-2xl shadow-lg shadow-indigo-500/20 text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-950 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                                >
                                    {isFetching ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Loading more...
                                        </>
                                    ) : (
                                        "Load More Results"
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
