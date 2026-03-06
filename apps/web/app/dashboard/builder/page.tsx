"use client";

import { api } from "@/utils/trpc/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    DollarSign,
    ShoppingCart,
    Eye,
    Star,
    Pencil,
    Layers,
    ExternalLink,
    Package,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCardSkeleton } from "@/components/ui/loading-skeleton";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";

export default function BuilderOverviewPage() {
    const router = useRouter();

    // Auth Check manually to prevent TRPC stale cache infinite redirect loop
    const [user, setUser] = useState<{ id: string; role: string; fullName: string } | null>(null);
    const [userLoading, setUserLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const { createClient } = await import("@/utils/supabase/client");
            const supabase = createClient();
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (!authUser) {
                router.push("/login");
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("role, full_name")
                .eq("id", authUser.id)
                .single();

            const role = profile?.role || "buyer";

            if (role === "buyer") {
                router.push("/dashboard");
                return;
            }

            setUser({
                id: authUser.id,
                role,
                fullName: profile?.full_name || "",
            });
            setUserLoading(false);
        };

        fetchUser();
    }, [router]);

    const { data: stats, isLoading: statsLoading } = api.dashboard.getBuilderStats.useQuery(
        { builderId: user?.id || "" },
        { enabled: !!user?.id }
    );

    const isLoading = userLoading || statsLoading;

    if (!user || userLoading) {
        return (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-500">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Overview
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Welcome back, {user.fullName?.split(" ")[0] || "Builder"}. Here&apos;s what&apos;s happening with your assets today.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {isLoading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
                        <StatCard
                            title="Total Revenue"
                            value={new Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: "INR",
                                maximumFractionDigits: 0,
                            }).format(stats?.totalRevenue || 0)}
                            description="All-time earnings"
                            icon={DollarSign}
                        />
                        <StatCard
                            title="Total Sales"
                            value={stats?.totalSales || 0}
                            description="Licenses sold"
                            icon={ShoppingCart}
                        />
                        <StatCard
                            title="Total Views"
                            value={stats?.totalViews || 0}
                            description="Asset page views"
                            icon={Eye}
                        />
                        <StatCard
                            title="Avg Rating"
                            value={(stats?.avgRating || 0).toFixed(1)}
                            description="User feedback"
                            icon={Star}
                        />
                    </>
                )}
            </div>

            {/* Recent Listings */}
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Listings</h2>
                    <Link href="/dashboard/builder/listings">
                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                            View All
                        </Button>
                    </Link>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                            <thead className="border-b border-gray-200 bg-gray-50/50 text-xs uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Name</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Sales</th>
                                    <th className="px-6 py-4 font-medium">Revenue</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex items-center justify-center gap-2 text-gray-500">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                                                Loading listings...
                                            </div>
                                        </td>
                                    </tr>
                                ) : stats?.assets && stats.assets.length > 0 ? (
                                    stats.assets.slice(0, 5).map((asset: any) => (
                                        <tr key={asset.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                                                        {asset.thumbnailUrl ? (
                                                            <Image
                                                                src={asset.thumbnailUrl}
                                                                alt={asset.name}
                                                                width={48}
                                                                height={48}
                                                                className="h-full w-full object-cover"
                                                                unoptimized
                                                            />
                                                        ) : (
                                                            <Package className="h-5 w-5 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            {asset.name}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {asset.category?.name || "Uncategorized"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant={
                                                        asset.status === "approved"
                                                            ? "success"
                                                            : asset.status === "pending_review"
                                                                ? "warning"
                                                                : "default"
                                                    }
                                                    size="sm"
                                                    className="capitalize"
                                                >
                                                    {asset.status.replace("_", " ")}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 font-medium">{asset.salesCount}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                {new Intl.NumberFormat("en-IN", {
                                                    style: "currency",
                                                    currency: "INR",
                                                    maximumFractionDigits: 0,
                                                }).format(asset.revenue || 0)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={`/asset/${asset.slug}/edit`}>
                                                        <Button variant="ghost" size="sm" className="!p-0 h-8 w-8 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/dashboard/builder/listings/${asset.id}/versions`}>
                                                        <Button variant="ghost" size="sm" className="!p-0 h-8 w-8 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                                                            <Layers className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/asset/${asset.slug}`} target="_blank">
                                                        <Button variant="ghost" size="sm" className="!p-0 h-8 w-8 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <EmptyState
                                                icon={Package}
                                                title="No listings yet"
                                                description="Submit your first AI tool or agent to start earning"
                                                action={{
                                                    label: "Submit Asset",
                                                    onClick: () => router.push("/asset/submit"),
                                                }}
                                            />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
