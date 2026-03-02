"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { api } from "@/utils/trpc/client";

export function SearchFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const { data: categories } = api.category.getAll.useQuery();

    // Local state for debounced inputs
    const [minPrice, setMinPrice] = useState<string>(searchParams.get("minPrice") || "");
    const [maxPrice, setMaxPrice] = useState<string>(searchParams.get("maxPrice") || "");

    const createQueryString = useCallback(
        (name: string, value: string, action: "set" | "append" | "delete" | "toggle" = "set") => {
            const params = new URLSearchParams(searchParams.toString());

            if (action === "set") {
                if (value) params.set(name, value);
                else params.delete(name);
            } else if (action === "append" || action === "toggle") {
                const currentValues = params.getAll(name);
                if (action === "toggle") {
                    if (currentValues.includes(value)) {
                        params.delete(name);
                        currentValues.filter(v => v !== value).forEach(v => params.append(name, v));
                    } else {
                        params.append(name, value);
                    }
                } else {
                    if (!currentValues.includes(value)) {
                        params.append(name, value);
                    }
                }
            } else if (action === "delete") {
                params.delete(name);
            }

            // Always reset to page 1 when filters change (we'll implement load more with offset conceptually)
            params.delete("offset");

            return params.toString();
        },
        [searchParams]
    );

    const updateUrl = useCallback((queryString: string) => {
        router.push(`${pathname}?${queryString}`, { scroll: false });
    }, [pathname, router]);

    // Handle Checkbox Toggles
    const handleCategoryToggle = (slug: string) => {
        const newQs = createQueryString("category", slug, "toggle");
        updateUrl(newQs);
    };

    // Debounce Price Filtering
    useEffect(() => {
        const handler = setTimeout(() => {
            let qs = searchParams.toString();
            const params = new URLSearchParams(qs);

            let validMin: number | undefined;
            let validMax: number | undefined;

            if (minPrice && !isNaN(Number(minPrice))) {
                validMin = Number(minPrice);
                params.set("minPrice", minPrice);
            } else {
                params.delete("minPrice");
            }

            if (maxPrice && !isNaN(Number(maxPrice))) {
                validMax = Number(maxPrice);
                params.set("maxPrice", maxPrice);
            } else {
                params.delete("maxPrice");
            }

            // Cross-validation: max cannot be less than min
            if (validMin !== undefined && validMax !== undefined && validMax < validMin) {
                // If invalid, revert the maxPrice locally to match minPrice
                setMaxPrice(minPrice);
                validMax = validMin;
                params.set("maxPrice", minPrice);
            }

            // check if anything actually changed to prevent infinite loops
            if (params.toString() !== searchParams.toString()) {
                params.delete("offset");
                updateUrl(params.toString());
            }

        }, 500);

        return () => clearTimeout(handler);
    }, [minPrice, maxPrice, searchParams, updateUrl]);

    // Sort Handler
    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newQs = createQueryString("sort", e.target.value, "set");
        updateUrl(newQs);
    };


    const selectedCategories = searchParams.getAll("category");
    const currentSort = searchParams.get("sort") || "relevance";

    return (
        <div className="w-full space-y-8 pr-6">
            {/* Sort Section */}
            <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 hover:text-indigo-500 transition-colors duration-300 cursor-default">
                    Sort By
                </h3>
                <div className="relative">
                    <select
                        className="w-full appearance-none rounded-xl border border-slate-200/50 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-300 cursor-pointer hover:border-indigo-500/50 shadow-sm"
                        value={currentSort}
                        onChange={handleSortChange}
                        id="sort-select"
                        aria-label="Sort configuration"
                    >
                        <option value="relevance" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Relevance</option>
                        <option value="newest" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Newest First</option>
                        <option value="popular" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Most Popular</option>
                        <option value="price_asc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Price: Low to High</option>
                        <option value="price_desc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Price: High to Low</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 dark:text-slate-400">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Price Filter */}
            <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 hover:text-indigo-500 transition-colors duration-300 cursor-default">
                    Price Range
                </h3>
                <div className="flex items-center space-x-2">
                    <div className="relative rounded-xl shadow-sm w-full">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                            <span className="text-slate-500 sm:text-sm font-medium">₹</span>
                        </div>
                        <input
                            type="number"
                            name="minPrice"
                            id="minPrice"
                            className="block w-full rounded-xl border border-slate-200/50 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-xl pl-8 pr-3 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300 hover:border-indigo-500/50 shadow-sm"
                            placeholder="Min"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                        />
                    </div>
                    <span className="text-slate-400 dark:text-slate-500 font-medium">-</span>
                    <div className="relative rounded-xl shadow-sm w-full">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                            <span className="text-slate-500 sm:text-sm font-medium">₹</span>
                        </div>
                        <input
                            type="number"
                            name="maxPrice"
                            id="maxPrice"
                            className="block w-full rounded-xl border border-slate-200/50 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-xl pl-8 pr-3 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300 hover:border-indigo-500/50 shadow-sm"
                            placeholder="Max"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Categories Filter */}
            <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 hover:text-indigo-500 transition-colors duration-300 cursor-default">
                    Categories
                </h3>
                <div className="space-y-3">
                    {categories?.map((cat: any) => (
                        <div key={cat.id} className="flex items-center group">
                            <input
                                id={`category-${cat.slug}`}
                                name={`category-${cat.slug}`}
                                type="checkbox"
                                checked={selectedCategories.includes(cat.slug)}
                                onChange={() => handleCategoryToggle(cat.slug)}
                                className="h-4 w-4 rounded border-slate-300 dark:border-white/10 text-indigo-500 focus:ring-indigo-500/50 dark:bg-white/5 dark:checked:bg-indigo-500 cursor-pointer transition-colors duration-300 shadow-sm"
                            />
                            <label
                                htmlFor={`category-${cat.slug}`}
                                className="ml-3 flex-1 flex justify-between text-sm leading-6 text-slate-600 dark:text-slate-300 cursor-pointer group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300"
                            >
                                <span>{cat.name}</span>
                                {cat.assetCount > 0 && (
                                    <span className="inline-flex items-center rounded-full bg-slate-100/80 dark:bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400 ring-1 ring-inset ring-slate-500/10 dark:ring-white/10 backdrop-blur-md">
                                        {cat.assetCount}
                                    </span>
                                )}
                            </label>
                        </div>
                    ))}

                    {!categories && (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded bg-slate-200/50 dark:bg-white/5 animate-pulse backdrop-blur-sm"></div>
                                    <div className="h-4 w-24 rounded bg-slate-200/50 dark:bg-white/5 animate-pulse backdrop-blur-sm"></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
