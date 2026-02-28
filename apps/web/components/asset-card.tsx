import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Eye } from "lucide-react";
import { formatPrice } from "@/utils/format";

export interface Asset {
    id: string;
    name: string;
    description: string;
    longDescription?: string | null;
    usageLicensePrice?: string | null;
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
}

export function AssetCard({
    asset,
    variant = "light",
}: {
    asset: Asset;
    variant?: "light" | "dark";
}) {
    const imageUrl =
        asset.thumbnailUrl ||
        `https://placehold.co/600x400/1e1b4b/a5b4fc?text=${encodeURIComponent(asset.name)}`;

    const isDark = variant === "dark";

    return (
        <Link href={`/asset/${asset.slug}`} className="group block h-full">
            <div
                className={`h-full overflow-hidden rounded-lg border shadow-sm transition-all ${isDark
                        ? "border-white/8 bg-white/3 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10"
                        : "border-gray-200 bg-white hover:border-blue-500 hover:shadow-md"
                    }`}
            >
                <div className="aspect-h-9 aspect-w-16 bg-gray-200">
                    <Image
                        src={imageUrl}
                        alt={asset.name}
                        width={600}
                        height={400}
                        unoptimized
                        className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </div>

                <div className="flex flex-col p-4">
                    <div className="mb-2 flex items-center justify-between">
                        <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${isDark
                                    ? "bg-indigo-500/15 text-indigo-300 ring-indigo-500/20"
                                    : "bg-blue-50 text-blue-700 ring-blue-700/10"
                                }`}
                        >
                            {asset.category?.name || "AI Tool"}
                        </span>
                        <div
                            className={`flex items-center ${isDark ? "text-slate-400" : "text-gray-500"}`}
                        >
                            {asset.status === "approved" && (
                                <BadgeCheck
                                    className={`h-4 w-4 ${isDark ? "text-indigo-400" : "text-blue-500"}`}
                                />
                            )}
                        </div>
                    </div>

                    <h3
                        className={`text-lg font-semibold transition-colors ${isDark
                                ? "text-slate-100 group-hover:text-indigo-300"
                                : "text-gray-900 group-hover:text-blue-600"
                            }`}
                    >
                        {asset.name}
                    </h3>

                    <p
                        className={`mt-1 line-clamp-2 flex-grow text-sm ${isDark ? "text-slate-400" : "text-gray-500"
                            }`}
                    >
                        {asset.description}
                    </p>

                    <div
                        className={`mt-4 flex items-center justify-between border-t pt-4 ${isDark ? "border-white/8" : "border-gray-100"
                            }`}
                    >
                        <div
                            className={`flex items-center font-bold ${isDark ? "text-white" : "text-gray-900"
                                }`}
                        >
                            {formatPrice(asset.usageLicensePrice)}
                        </div>
                        <div className="flex items-center gap-3">
                            {asset.viewsCount !== undefined && (
                                <span
                                    className={`flex items-center text-xs ${isDark ? "text-slate-500" : "text-gray-500"
                                        }`}
                                >
                                    <Eye className="mr-1 h-3 w-3" />
                                    {asset.viewsCount}
                                </span>
                            )}
                            <span
                                className={`text-xs ${isDark ? "text-slate-500" : "text-gray-400"}`}
                            >
                                View Details →
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
