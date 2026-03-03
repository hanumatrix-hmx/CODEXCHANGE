"use client";

import { useTransition, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, ChevronDown } from "lucide-react";

interface Category {
    id: string;
    name: string;
    slug: string;
}

const SORT_OPTIONS = [
    { label: "Newest", value: "newest" },
    { label: "Price: Low to High", value: "price_asc" },
    { label: "Price: High to Low", value: "price_desc" },
    { label: "Most Popular", value: "popular" },
];

export function SearchAndFilter({ categories }: { categories: Category[] }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // local state
    const currentCategory = searchParams.get("category") || "all";
    const currentSort = searchParams.get("sort") || "newest";
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [isSortOpen, setIsSortOpen] = useState(false);

    // drag to scroll state
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // Native wheel event interceptor with custom smooth inertia
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        let animationFrameId: number;
        let targetScroll = container.scrollLeft;
        let isAnimating = false;

        const smoothScroll = () => {
            const currentScroll = container.scrollLeft;
            const diff = targetScroll - currentScroll;

            // If we're close enough, snap and stop animating
            if (Math.abs(diff) < 0.5) {
                container.scrollLeft = targetScroll;
                isAnimating = false;
                return;
            }

            // Lerp towards target
            container.scrollLeft = currentScroll + diff * 0.15; // The 0.15 controls slickness/speed
            animationFrameId = requestAnimationFrame(smoothScroll);
        };

        const handleNativeWheel = (e: WheelEvent) => {
            if (e.deltaY !== 0 && !e.shiftKey) {
                e.preventDefault();

                // Base target off current position if we just started, 
                // otherwise accumulate off the existing target for rapid scrolling
                if (!isAnimating) {
                    targetScroll = container.scrollLeft;
                }

                // Add wheel delta to target. Multiplier handles sensitivity.
                targetScroll += e.deltaY * 1.5;

                // Clamp target to bounds
                targetScroll = Math.max(0, Math.min(targetScroll, container.scrollWidth - container.clientWidth));

                if (!isAnimating) {
                    isAnimating = true;
                    animationFrameId = requestAnimationFrame(smoothScroll);
                }
            }
        };

        container.addEventListener("wheel", handleNativeWheel, { passive: false });

        return () => {
            container.removeEventListener("wheel", handleNativeWheel);
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            if (searchQuery) {
                params.set("search", searchQuery);
            } else {
                params.delete("search");
            }
            params.delete("page"); // reset page on search

            // Only push if changed
            if (searchParams.get("search") !== (searchQuery || null)) {
                startTransition(() => {
                    router.push(`${pathname}?${params.toString()}`);
                });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, pathname, router, searchParams]);

    const handleCategoryChange = (slug: string) => {
        const params = new URLSearchParams(searchParams);
        if (slug === "all") {
            params.delete("category");
        } else {
            params.set("category", slug);
        }
        params.delete("page");
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const handleSortChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value === "newest") {
            params.delete("sort");
        } else {
            params.set("sort", value);
        }
        params.delete("page");
        setIsSortOpen(false);
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    // Drag-to-scroll handlers
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        setStartX(e.pageX - e.currentTarget.offsetLeft);
        setScrollLeft(e.currentTarget.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - e.currentTarget.offsetLeft;
        const walk = (x - startX) * 2; // scroll-fast multiplier
        e.currentTarget.scrollLeft = scrollLeft - walk;
    };

    // Removed React onWheel since we use native event listener above now

    return (
        <div className="flex flex-col gap-6">
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                    type="text"
                    className="block w-full rounded-2xl border-0 py-4 pl-12 pr-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-base dark:bg-slate-900 dark:text-slate-100 dark:ring-white/10 dark:placeholder:text-slate-500"
                    placeholder="Search AI agents, components, and tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isPending && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-indigo-600"></div>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Horizontal scroll pills */}
                <div
                    ref={scrollContainerRef}
                    className={`scrollbar-hide flex-1 overflow-x-auto pb-2 sm:pb-0 min-w-0 select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                >
                    <div className="flex gap-2 w-max">
                        <button
                            onClick={() => handleCategoryChange("all")}
                            className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors ${currentCategory === "all"
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                }`}
                        >
                            All Assets
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryChange(cat.slug)}
                                className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors ${currentCategory === cat.slug
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sort Dropdown */}
                <div className="relative shrink-0">
                    <button
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="flex w-full items-center justify-between gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-white dark:ring-white/10 dark:hover:bg-slate-800 sm:w-auto"
                    >
                        Sort by: {SORT_OPTIONS.find((s) => s.value === currentSort)?.label || "Newest"}
                        <ChevronDown className={`h-4 w-4 transition-transform ${isSortOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isSortOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsSortOpen(false)}
                            />
                            <div className="absolute right-0 top-full z-20 mt-2 w-48 origin-top-right rounded-xl bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-slate-800 dark:ring-white/10">
                                {SORT_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleSortChange(option.value)}
                                        className={`block w-full px-4 py-2 text-left text-sm ${currentSort === option.value
                                            ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                                            : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50"
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
