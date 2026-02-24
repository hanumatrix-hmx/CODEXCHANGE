"use client";

import { api } from "@/utils/trpc/client";
import { notFound, useParams } from "next/navigation";
import { Eye, ShieldCheck, ExternalLink, Github, Globe, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ZoomImage } from "@/components/ui/zoom-image";
import { QualityBadge } from "@/components/quality-badge";
import { PricingCard } from "@/components/pricing-card";
import { AssetCard } from "@/components/asset-card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useEffect } from "react";

export default function AssetPage() {
    const params = useParams();
    const slug = params.slug as string;

    // Fetch asset data
    const { data: asset, isLoading } = api.asset.getBySlug.useQuery({ slug });

    // Fetch related assets
    const { data: relatedAssets } = api.asset.getRelated.useQuery(
        {
            categoryId: asset?.categoryId || "",
            excludeAssetId: asset?.id || "",
            limit: 4,
        },
        {
            enabled: !!asset,
        }
    );

    const incrementViews = api.asset.incrementViews.useMutation();

    // Increment view count on client-side after asset loads
    useEffect(() => {
        if (asset?.id) {
            incrementViews.mutate({ assetId: asset.id });
        }
    }, [asset?.id]);


    if (isLoading) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <LoadingSkeleton className="mb-4 h-8 w-64" />
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    <LoadingSkeleton className="h-96 w-full" />
                    <div className="space-y-4">
                        <LoadingSkeleton className="h-12 w-3/4" />
                        <LoadingSkeleton className="h-24 w-full" />
                        <LoadingSkeleton className="h-32 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (!asset) {
        notFound();
    }

    const imageUrl = asset.thumbnailUrl || `https://placehold.co/1200x800?text=${encodeURIComponent(asset.name)}`;

    const usageLicenseFeatures = asset.licenseFeatures?.usage || [
        "Deploy to production",
        "Unlimited end users",
        "Technical support",
        "Updates for 1 year",
    ];

    const sourceLicenseFeatures = asset.licenseFeatures?.source || [
        "Full source code access",
        "Modify and customize",
        "White-label rights",
        "Lifetime updates",
        "Priority support",
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb */}
            <div className="border-b border-gray-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <Link
                        href="/browse"
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Browse
                    </Link>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Hero Section with Pricing */}
                <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Left: Image - 2 columns */}
                    <div className="lg:col-span-2">
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <ZoomImage
                                src={imageUrl}
                                alt={asset.name}
                                className="h-[500px] w-full object-cover"
                            />
                        </div>

                        {/* Basic Info - Below image on desktop */}
                        <div className="mt-8">
                            <div className="mb-4 flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                    {asset.category?.name || "AI Tool"}
                                </span>
                                {asset.qualityTier && (
                                    <QualityBadge tier={asset.qualityTier as any} />
                                )}
                            </div>

                            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                                {asset.name}
                            </h1>

                            {asset.status === "approved" && (
                                <div className="mt-4 flex items-center">
                                    <ShieldCheck className="mr-2 h-5 w-5 text-green-600" />
                                    <span className="text-sm font-medium text-green-600">
                                        Verified by CODEXCHANGE
                                    </span>
                                </div>
                            )}

                            <p className="mt-6 text-lg leading-relaxed text-gray-700">
                                {asset.description}
                            </p>

                            {/* Tech Stack */}
                            {asset.techStack && asset.techStack.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-sm font-medium text-gray-900">Tech Stack</h3>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {asset.techStack.map((tech, index) => (
                                            <Link
                                                key={index}
                                                href={`/browse?tag=${encodeURIComponent(tech)}`}
                                                className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800 hover:bg-gray-200"
                                            >
                                                {tech}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            {asset.tags && asset.tags.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-sm font-medium text-gray-900">Tags</h3>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {asset.tags.map((item: any) => (
                                            <Link
                                                key={item.tag.id}
                                                href={`/browse?tag=${encodeURIComponent(item.tag.name)}`}
                                                className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                                            >
                                                #{item.tag.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Links */}
                            <div className="mt-6 flex gap-4">
                                {asset.demoUrl && (
                                    <a
                                        href={asset.demoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                                    >
                                        <Globe className="mr-1.5 h-4 w-4" />
                                        Live Demo
                                        <ExternalLink className="ml-1 h-3 w-3" />
                                    </a>
                                )}
                                {(asset as any).documentationUrl && (
                                    <a
                                        href={(asset as any).documentationUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                                    >
                                        <Github className="mr-1.5 h-4 w-4" />
                                        Documentation
                                        <ExternalLink className="ml-1 h-3 w-3" />
                                    </a>
                                )}
                            </div>

                            {/* Builder Info */}
                            {asset.builder && (
                                <div className="mt-8 rounded-lg border border-gray-200 bg-white p-4">
                                    <h3 className="text-sm font-medium text-gray-900">Built by</h3>
                                    <div className="mt-2 flex items-center">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                            {asset.builder.fullName?.charAt(0) || "?"}
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900">
                                                {asset.builder.fullName || "Anonymous"}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {asset.builder.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Sticky Pricing - 1 column */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-20 space-y-6">
                            <h2 className="text-xl font-bold text-gray-900">Choose Your License</h2>
                            {asset.usageLicensePrice && (
                                <PricingCard
                                    licenseType="usage"
                                    price={Number(asset.usageLicensePrice)}
                                    scarcity={{
                                        total: asset.maxLicenses || 100,
                                        remaining: (asset.maxLicenses || 100) - (asset.soldLicenses || 0),
                                    }}
                                    features={usageLicenseFeatures}
                                    assetId={asset.id}
                                />
                            )}
                            {asset.sourceLicensePrice && (
                                <PricingCard
                                    licenseType="source"
                                    price={Number(asset.sourceLicensePrice)}
                                    scarcity={{
                                        total: asset.maxLicenses || 50,
                                        remaining: (asset.maxLicenses || 50) - (asset.soldLicenses || 0),
                                    }}
                                    features={sourceLicenseFeatures}
                                    assetId={asset.id}
                                />
                            )}

                            {/* Total Views */}
                            <div className="mt-4 flex items-center justify-center text-sm text-gray-500 bg-gray-50 py-2 rounded-lg border border-gray-100">
                                <Eye className="mr-2 h-4 w-4" />
                                <span>{asset.viewsCount} total views</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gallery Section */}
                {asset.listingImages && asset.listingImages.length > 0 && (
                    <div className="mb-12">
                        <h2 className="mb-6 text-2xl font-bold text-gray-900">Gallery</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {asset.listingImages
                                .filter((img) => img.sortOrder > 0) // Filter out cover image (sortOrder 0) if desired, or show all
                                .map((image) => (
                                    <div
                                        key={image.id}
                                        className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                                    >
                                        <div className="aspect-video w-full overflow-hidden bg-gray-100">
                                            <ZoomImage
                                                src={image.url}
                                                alt={`Gallery image`}
                                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                            />
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Long Description */}
                {asset.longDescription && (
                    <div className="mb-12 rounded-xl border border-gray-200 bg-white p-8">
                        <h2 className="mb-4 text-2xl font-bold text-gray-900">
                            About This Asset
                        </h2>
                        <div className="prose max-w-none text-gray-700">
                            <p className="whitespace-pre-wrap">{asset.longDescription}</p>
                        </div>
                    </div>
                )}

                {/* Related Assets */}
                {relatedAssets && relatedAssets.length > 0 && (
                    <div>
                        <h2 className="mb-6 text-2xl font-bold text-gray-900">
                            More in {asset.category?.name}
                        </h2>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {relatedAssets.map((relatedAsset) => (
                                <AssetCard key={relatedAsset.id} asset={relatedAsset as any} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
