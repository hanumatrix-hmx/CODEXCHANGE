"use client";

import { api } from "@/utils/trpc/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DollarSign, Package, TrendingUp, Download, Plus, Eye, ShoppingCart } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatCardSkeleton } from "@/components/ui/loading-skeleton";
import { formatPrice } from "@/utils/format";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ id: string; role: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (!authUser) {
                router.push("/login");
                return;
            }

            // Fetch user profile to get role
            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", authUser.id)
                .single();

            setUser({
                id: authUser.id,
                role: profile?.role || "buyer",
            });
            setLoading(false);
        };

        fetchUser();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (user.role === "builder" || user.role === "admin") {
        return <BuilderDashboard userId={user.id} />;
    }

    return <BuyerDashboard userId={user.id} />;
}

function BuilderDashboard({ userId }: { userId: string }) {
    const router = useRouter();
    const { data: stats, isLoading } = api.dashboard.getBuilderStats.useQuery({
        builderId: userId,
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Builder Dashboard</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Manage your assets and track your earnings
                            </p>
                        </div>
                        <Link href="/asset/submit">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Submit New Asset
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Stats Grid */}
                <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                                value={formatPrice(stats?.totalRevenue || 0)}
                                description="All-time earnings"
                                icon={DollarSign}
                            />
                            <StatCard
                                title="Pending Payout"
                                value={formatPrice(stats?.pendingPayout || 0)}
                                description="Ready to withdraw"
                                icon={TrendingUp}
                            />
                            <StatCard
                                title="Total Assets"
                                value={stats?.totalAssets || 0}
                                description={`${stats?.approvedAssets || 0} approved`}
                                icon={Package}
                            />
                            <StatCard
                                title="Total Sales"
                                value={stats?.totalSales || 0}
                                description="Licenses sold"
                                icon={ShoppingCart}
                            />
                        </>
                    )}
                </div>

                {/* My Assets */}
                <Card variant="bordered">
                    <CardHeader>
                        <h2 className="text-xl font-semibold text-gray-900">My Assets</h2>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="h-20 animate-pulse rounded-lg bg-gray-200"
                                    />
                                ))}
                            </div>
                        ) : stats?.assets && stats.assets.length > 0 ? (
                            <div className="space-y-4">
                                {stats.assets.map((asset: any) => (
                                    <div
                                        key={asset.id}
                                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-medium text-gray-900">
                                                    {asset.name}
                                                </h3>
                                                <Badge
                                                    variant={
                                                        asset.status === "approved"
                                                            ? "success"
                                                            : asset.status === "pending_review"
                                                                ? "warning"
                                                                : "danger"
                                                    }
                                                    size="sm"
                                                >
                                                    {asset.status}
                                                </Badge>
                                            </div>
                                            <div className="mt-2 flex gap-6 text-sm text-gray-500">
                                                <span className="flex items-center">
                                                    <Eye className="mr-1 h-4 w-4" />
                                                    {asset.viewsCount || 0} views
                                                </span>
                                                <span className="flex items-center">
                                                    <ShoppingCart className="mr-1 h-4 w-4" />
                                                    {asset.salesCount || 0} sales
                                                </span>
                                                <span className="font-medium text-gray-900">
                                                    Revenue: {formatPrice(asset.revenue || 0)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link href={`/asset/${asset.slug}`}>
                                                <Button variant="outline" size="sm">
                                                    View
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={Package}
                                title="No assets yet"
                                description="Submit your first AI tool or agent to start earning"
                                action={{
                                    label: "Submit Asset",
                                    onClick: () => router.push("/asset/submit"),
                                }}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function BuyerDashboard({ userId }: { userId: string }) {
    const router = useRouter();
    const { data: stats, isLoading: statsLoading } = api.dashboard.getBuyerStats.useQuery({
        buyerId: userId,
    });

    const { data: licenses, isLoading: licensesLoading } = api.license.getUserLicenses.useQuery({
        userId,
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Manage your licenses and purchases
                            </p>
                        </div>
                        <Link href="/browse">
                            <Button>
                                <Package className="mr-2 h-4 w-4" />
                                Browse Assets
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Stats Grid */}
                <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {statsLoading ? (
                        <>
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                        </>
                    ) : (
                        <>
                            <StatCard
                                title="Total Licenses"
                                value={stats?.totalLicenses || 0}
                                description="All purchases"
                                icon={Package}
                            />
                            <StatCard
                                title="Active Licenses"
                                value={stats?.activeLicenses || 0}
                                description="Currently valid"
                                icon={TrendingUp}
                            />
                            <StatCard
                                title="Expired"
                                value={stats?.expiredLicenses || 0}
                                description="Need renewal"
                                icon={Download}
                            />
                        </>
                    )}
                </div>

                {/* My Licenses */}
                <Card variant="bordered">
                    <CardHeader>
                        <h2 className="text-xl font-semibold text-gray-900">My Licenses</h2>
                    </CardHeader>
                    <CardContent>
                        {licensesLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="h-24 animate-pulse rounded-lg bg-gray-200"
                                    />
                                ))}
                            </div>
                        ) : licenses && licenses.length > 0 ? (
                            <div className="space-y-4">
                                {licenses.map((license: any) => (
                                    <div
                                        key={license.id}
                                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                                                <Package className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900">
                                                    {license.asset?.name || "Unknown Asset"}
                                                </h3>
                                                <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                                                    <span className="capitalize">
                                                        {license.licenseType} License
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                        Purchased{" "}
                                                        {new Date(
                                                            license.createdAt
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge
                                                variant={
                                                    license.status === "active"
                                                        ? "success"
                                                        : "danger"
                                                }
                                            >
                                                {license.status}
                                            </Badge>
                                            <Button variant="outline" size="sm">
                                                <Download className="mr-2 h-4 w-4" />
                                                Download
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={Package}
                                title="No licenses yet"
                                description="Browse our marketplace to find AI tools for your agency"
                                action={{
                                    label: "Browse Assets",
                                    onClick: () => router.push("/browse"),
                                }}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
