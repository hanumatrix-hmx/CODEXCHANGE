import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Star } from "lucide-react";
import { formatPrice } from "@/utils/format";

export interface Asset {
    id: string;
    name: string;
    description: string;
    longDescription?: string | null;
    usageLicensePrice?: string | null;
    sourceLicensePrice?: string | null;
    slug: string;
    thumbnailUrl?: string | null;
    builderId: string;
    categoryId: string;
    status: string;
    viewsCount?: number;
    category?: {
        name: string;
        slug: string;
    } | null;
    rating?: number;
    salesCount?: number;
    soldLicenses?: number;
    builder?: {
        fullName?: string | null;
    } | null;
}

export function AssetCard({
    asset,
    variant = "light",
    layout = "vertical",
}: {
    asset: Asset;
    variant?: "light" | "dark";
    layout?: "vertical" | "horizontal";
}) {
    const imageUrl =
        asset.thumbnailUrl ||
        `https://placehold.co/600x400/1e1b4b/a5b4fc?text=${encodeURIComponent(asset.name)}`;

    const isDark = variant === "dark";
    const isHorizontal = layout === "horizontal";

    return (
        <Link href={`/asset/${asset.slug}`} className="group block h-full">
            <div
                className={`flex ${isHorizontal ? "flex-col sm:flex-row" : "flex-col"
                    } h-full overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 ${isDark
                        ? "border-white/8 bg-white/3 backdrop-blur-sm hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10"
                        : "border-gray-200 bg-white dark:border-white/8 dark:bg-white/3 dark:backdrop-blur-sm hover:border-indigo-500 hover:shadow-md dark:hover:border-indigo-500/50 dark:hover:shadow-lg dark:hover:shadow-indigo-500/10"
                    }`}
            >
                <div className={`${isHorizontal ? "w-1/3 shrink-0 relative" : "aspect-h-9 aspect-w-16"} bg-gray-200`}>
                    <Image
                        src={imageUrl}
                        alt={asset.name}
                        width={600}
                        height={400}
                        unoptimized
                        className={`${isHorizontal ? "absolute inset-0 h-full w-full object-cover" : "h-48 w-full object-cover"} transition-transform duration-300 group-hover:scale-105`}
                    />
                </div>

                <div className={`flex flex-col ${isHorizontal ? "p-6 w-2/3" : "p-4"} flex-grow`}>
                    <div className="mb-2 flex items-center justify-between">
                        <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${isDark
                                ? "bg-indigo-500/15 text-indigo-300 ring-indigo-500/20"
                                : "bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-500/20"
                                }`}
                        >
                            {asset.category?.name || "AI Tool"}
                        </span>
                        <div
                            className={`flex items-center ${isDark ? "text-slate-400" : "text-gray-500 dark:text-slate-400"}`}
                        >
                            {asset.status === "approved" && (
                                <BadgeCheck
                                    className={`h-4 w-4 ${isDark ? "text-indigo-400" : "text-blue-500 dark:text-indigo-400"}`}
                                />
                            )}
                        </div>
                    </div>

                    <h3
                        className={`text-lg font-semibold truncate transition-colors duration-300 ${isDark
                            ? "text-slate-100 group-hover:text-indigo-300"
                            : "text-gray-900 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-300"
                            }`}
                    >
                        {asset.name}
                    </h3>

                    <p
                        className={`mt-1 line-clamp-2 text-sm ${isDark ? "text-slate-400" : "text-gray-500 dark:text-slate-400"
                            }`}
                    >
                        {asset.description}
                    </p>

                    <div className="mt-3 flex flex-col gap-2">
                        <div
                            className={`flex items-center text-sm font-bold ${isDark ? "text-white" : "text-gray-900 dark:text-white"
                                }`}
                        >
                            {formatPrice(asset.usageLicensePrice)} Usage
                            {asset.sourceLicensePrice ? (
                                <span className={`ml-1 font-bold ${isDark ? "text-white" : "text-gray-900 dark:text-white"}`}>
                                    | {formatPrice(asset.sourceLicensePrice)} Source
                                </span>
                            ) : (
                                <span className={`ml-1 font-bold ${isDark ? "text-white" : "text-gray-900 dark:text-white"}`}>
                                    | {formatPrice(asset.usageLicensePrice || null)} Source
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1 text-xs">
                            {/* TODO: Implement real rating system. 4.2 is a placeholder for now */}
                            <div className="flex items-center text-amber-500">
                                <Star className="h-3 w-3 fill-current" />
                                <span className={`ml-1 font-medium ${isDark ? "text-slate-300" : "text-slate-700 dark:text-slate-300"}`}>
                                    {(asset.rating || 4.2).toFixed(1)}
                                </span>
                            </div>
                            <span className={`mx-1 ${isDark ? "text-slate-600" : "text-slate-300 dark:text-slate-600"}`}>·</span>
                            <span className={`${isDark ? "text-slate-400" : "text-slate-500 dark:text-slate-400"}`}>
                                {asset.soldLicenses !== undefined ? asset.soldLicenses : (asset.salesCount || 0)} sold
                            </span>
                        </div>

                        <div className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-500 dark:text-slate-400"}`}>
                            by @{asset.builder?.fullName ? asset.builder.fullName.replace(/\s+/g, '').toLowerCase() : "builder"}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
