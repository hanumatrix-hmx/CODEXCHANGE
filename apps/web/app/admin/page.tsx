"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/trpc/client";
import { Shield, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/utils/format";
import { QualityBadge } from "@/components/quality-badge";
import { createClient } from "@/utils/supabase/client";

type QualityTier = "bronze" | "silver" | "gold";

export default function AdminPage() {
    const router = useRouter();
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [qualityTier, setQualityTier] = useState<QualityTier>("bronze");
    const [usagePrice, setUsagePrice] = useState("");
    const [sourcePrice, setSourcePrice] = useState("");
    const [rejectReason, setRejectReason] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
    const { data: pendingAssets, isLoading, refetch } = api.admin.getPendingSubmissions.useQuery(
        undefined,
        { enabled: isAdmin } // Only fetch when user is confirmed admin
    );
    const approveMutation = api.admin.approveAsset.useMutation();
    const rejectMutation = api.admin.rejectAsset.useMutation();

    // Check admin access
    useEffect(() => {
        const checkAdminAccess = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert("Access Denied: Please log in");
                router.push("/login");
                return;
            }

            // Fetch user profile to check role
            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (profile?.role !== "admin") {
                alert("Access Denied: Admin privileges required");
                router.push("/");
                return;
            }

            setIsAdmin(true);
            setUserId(user.id);
            setLoading(false);
        };

        checkAdminAccess();
    }, [router]);

    const handleApprove = async () => {
        if (!selectedAsset || !userId) return;

        try {
            await approveMutation.mutateAsync({
                assetId: selectedAsset.id,
                qualityTier,
                usageLicensePrice: usagePrice ? Number(usagePrice) : undefined,
                sourceLicensePrice: sourcePrice ? Number(sourcePrice) : undefined,
                adminId: userId,
            });

            alert("Asset approved successfully!");
            setSelectedAsset(null);
            refetch();
        } catch (error) {
            alert("Failed to approve asset");
        }
    };

    const handleReject = async () => {
        if (!selectedAsset || !rejectReason || !userId) {
            alert("Please provide a rejection reason");
            return;
        }

        try {
            await rejectMutation.mutateAsync({
                assetId: selectedAsset.id,
                reason: rejectReason,
                adminId: userId,
            });

            alert("Asset rejected");
            setSelectedAsset(null);
            setRejectReason("");
            refetch();
        } catch (error) {
            alert("Failed to reject asset");
        }
    };

    // Show loading or nothing while checking access
    if (loading || !isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex items-center">
                        <Shield className="mr-3 h-8 w-8 text-blue-600" />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Admin Quality Gate</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Review and approve asset submissions
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Left: Pending Queue */}
                    <div className="lg:col-span-1">
                        <Card variant="bordered">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Pending Review
                                    </h2>
                                    <Badge variant="warning">
                                        {pendingAssets?.length || 0}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div
                                                key={i}
                                                className="h-20 animate-pulse rounded-lg bg-gray-200"
                                            />
                                        ))}
                                    </div>
                                ) : pendingAssets && pendingAssets.length > 0 ? (
                                    <div className="space-y-3">
                                        {pendingAssets.map((asset: any) => (
                                            <button
                                                key={asset.id}
                                                onClick={() => setSelectedAsset(asset)}
                                                className={`w-full rounded-lg border p-4 text-left transition-all ${selectedAsset?.id === asset.id
                                                    ? "border-blue-500 bg-blue-50"
                                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                                    }`}
                                            >
                                                <h3 className="font-medium text-gray-900">
                                                    {asset.name}
                                                </h3>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    by {asset.builder?.fullName || "Unknown"}
                                                </p>
                                                <div className="mt-2 flex items-center text-xs text-gray-400">
                                                    <Clock className="mr-1 h-3 w-3" />
                                                    {new Date(asset.createdAt).toLocaleDateString()}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon={CheckCircle}
                                        title="All caught up!"
                                        description="No pending submissions to review"
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Review Panel */}
                    <div className="lg:col-span-2">
                        {selectedAsset ? (
                            <Card variant="bordered">
                                <CardHeader>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Review Asset
                                    </h2>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Asset Details */}
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">
                                            {selectedAsset.name}
                                        </h3>
                                        <p className="mt-2 text-gray-700">
                                            {selectedAsset.description}
                                        </p>
                                        {selectedAsset.longDescription && (
                                            <p className="mt-4 text-sm text-gray-600">
                                                {selectedAsset.longDescription}
                                            </p>
                                        )}
                                    </div>

                                    {/* Metadata */}
                                    <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
                                        <div>
                                            <p className="text-xs text-gray-500">Category</p>
                                            <p className="font-medium text-gray-900">
                                                {selectedAsset.category?.name || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Builder</p>
                                            <p className="font-medium text-gray-900">
                                                {selectedAsset.builder?.fullName || "Unknown"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Requested Usage Price
                                            </p>
                                            <p className="font-medium text-gray-900">
                                                {formatPrice(selectedAsset.usageLicensePrice)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Requested Source Price
                                            </p>
                                            <p className="font-medium text-gray-900">
                                                {formatPrice(selectedAsset.sourceLicensePrice)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Links */}
                                    <div className="flex gap-4">
                                        {selectedAsset.demoUrl && (
                                            <a
                                                href={selectedAsset.demoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                                            >
                                                <Eye className="mr-1.5 h-4 w-4" />
                                                View Demo
                                            </a>
                                        )}
                                        {selectedAsset.documentationUrl && (
                                            <a
                                                href={selectedAsset.documentationUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                                            >
                                                View Docs
                                            </a>
                                        )}
                                    </div>

                                    <hr className="border-gray-200" />

                                    {/* Quality Tier Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900">
                                            Quality Tier
                                        </label>
                                        <div className="mt-2 flex gap-3">
                                            {(["bronze", "silver", "gold"] as QualityTier[]).map(
                                                (tier) => (
                                                    <button
                                                        key={tier}
                                                        onClick={() => setQualityTier(tier)}
                                                        className={`rounded-lg border-2 p-3 transition-all ${qualityTier === tier
                                                            ? "border-blue-500 bg-blue-50"
                                                            : "border-gray-200 hover:border-gray-300"
                                                            }`}
                                                    >
                                                        <QualityBadge tier={tier} />
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {/* Price Override */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-900">
                                                Usage License Price (₹)
                                            </label>
                                            <input
                                                type="number"
                                                value={usagePrice}
                                                onChange={(e) => setUsagePrice(e.target.value)}
                                                placeholder={selectedAsset.usageLicensePrice || "0"}
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-900">
                                                Source License Price (₹)
                                            </label>
                                            <input
                                                type="number"
                                                value={sourcePrice}
                                                onChange={(e) => setSourcePrice(e.target.value)}
                                                placeholder={
                                                    selectedAsset.sourceLicensePrice || "0"
                                                }
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Rejection Reason */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900">
                                            Rejection Reason (if rejecting)
                                        </label>
                                        <textarea
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                            rows={3}
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Explain why this asset is being rejected..."
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={handleApprove}
                                            variant="primary"
                                            className="flex-1"
                                            isLoading={approveMutation.isPending}
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Approve Asset
                                        </Button>
                                        <Button
                                            onClick={handleReject}
                                            variant="danger"
                                            className="flex-1"
                                            isLoading={rejectMutation.isPending}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Reject Asset
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card variant="bordered">
                                <CardContent className="py-16">
                                    <EmptyState
                                        icon={Shield}
                                        title="Select an asset to review"
                                        description="Choose a pending submission from the list to start reviewing"
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
