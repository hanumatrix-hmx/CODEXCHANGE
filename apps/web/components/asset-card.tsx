import Link from "next/link";
import { BadgeCheck } from "lucide-react";
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
    category?: {
        name: string;
        slug: string;
    } | null;
}

export function AssetCard({ asset }: { asset: Asset }) {
    const imageUrl = asset.thumbnailUrl || `https://placehold.co/600x400?text=${asset.name}`;

    return (
        <Link href={`/asset/${asset.slug}`} className="group block h-full">
            <div className="h-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:border-blue-500 hover:shadow-md">
                <div className="aspect-h-9 aspect-w-16 bg-gray-200">
                    <img
                        src={imageUrl}
                        alt={asset.name}
                        className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </div>
                <div className="flex flex-col p-4">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            {asset.category?.name || "AI Tool"}
                        </span>
                        <div className="flex items-center text-gray-500">
                            {asset.status === "approved" && (
                                <BadgeCheck className="h-4 w-4 text-blue-500" />
                            )}
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                        {asset.name}
                    </h3>

                    <p className="mt-1 line-clamp-2 flex-grow text-sm text-gray-500">
                        {asset.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                        <div className="flex items-center text-gray-900 font-bold">
                            {formatPrice(asset.usageLicensePrice)}
                        </div>
                        <span className="text-xs text-gray-400">View Details →</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
