"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useCallback } from "react";
import {
    ArrowLeft,
    Copy,
    Check,
    Download,
    FileText,
    ShieldOff,
    ArrowRightLeft,
    Package,
    Calendar,
    Key,
    Shield,
    X,
    Loader2,
    ExternalLink,
    AlertTriangle,
} from "lucide-react";
import { api } from "@/utils/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

// ─── Toast Notification ────────────────────────────────────────────
type ToastType = "success" | "error" | "info";

function Toast({
    message,
    type,
    onClose,
}: {
    message: string;
    type: ToastType;
    onClose: () => void;
}) {
    const bgMap: Record<ToastType, string> = {
        success: "bg-green-600",
        error: "bg-red-600",
        info: "bg-blue-600",
    };

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg px-5 py-3 text-white shadow-lg ${bgMap[type]} animate-slide-up`}
        >
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-80">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

// ─── Modal ─────────────────────────────────────────────────────────
function Modal({
    open,
    onClose,
    title,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="mx-4 w-full max-w-md rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 dark:text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    );
}

// ─── PDF Generator ─────────────────────────────────────────────────
async function generateLicensePdf(data: {
    licenseKey: string;
    licenseType: string;
    status: string;
    activatedAt: Date | string | null;
    expiresAt: Date | string | null;
    createdAt: Date | string;
    assetName: string;
    assetDescription: string;
    builderName: string;
    buyerName: string;
    buyerEmail: string;
    categoryName: string;
    orderId: string | null;
    orderAmount: string;
    orderCurrency: string;
}) {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ── Header bar (Brand Background)
    doc.setFillColor(2, 8, 23); // slate-950/deep space
    doc.rect(0, 0, pageWidth, 45, "F");

    // ── Brand Logo & Text
    // Logo Diamond
    const brandColor = [139, 92, 246]; // violet-500
    doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
    // Top half triangle
    doc.triangle(24, 18, 28, 22, 20, 22, "F");
    // Bottom half triangle
    doc.triangle(20, 22, 28, 22, 24, 26, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);

    // "CODE" part (White)
    doc.setTextColor(255, 255, 255);
    doc.text("CODE", 34, 25);
    const codeWidth = doc.getTextWidth("CODE");

    // "EXCHANGE" part (Brand Color)
    doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.text("EXCHANGE", 34 + codeWidth, 25);

    // ── Title
    let y = 65;
    doc.setTextColor(30, 41, 59); // slate-800
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    const title = "License Agreement";
    const titleWidthDoc = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidthDoc) / 2, y);
    y += 18;

    // ── Helper for Table Rows
    const drawRow = (label: string, value: string) => {
        // Label (Bold)
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(label, 20, y);
        
        // Value (Normal)
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85); // slate-700
        doc.text(value, 80, y);
        
        y += 4;
        // Line below row
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.line(20, y, pageWidth - 20, y);
        y += 8;
    };

    // ── Table Rows
    // Top border for the table
    doc.setDrawColor(226, 232, 240);
    doc.line(20, y - 8, pageWidth - 20, y - 8);

    drawRow("License Key:", data.licenseKey);
    drawRow("License Type:", data.licenseType.charAt(0).toUpperCase() + data.licenseType.slice(1) + " License");
    drawRow("Status:", data.status.charAt(0).toUpperCase() + data.status.slice(1));
    drawRow("Asset Name:", data.assetName);
    drawRow("Licensor:", data.builderName);
    drawRow("Licensee Name:", `${data.buyerName}`);
    
    const issuedDate = new Date(data.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
    const expiryDate = data.expiresAt ? new Date(data.expiresAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "Perpetual";
    drawRow("Issued Date:", issuedDate);
    drawRow("Expiry:", expiryDate);
    
    drawRow("Category:", data.categoryName || "N/A");
    
    const amountNum = parseFloat(data.orderAmount);
    const amountStr = amountNum === 0 ? "Free" : `${data.orderCurrency} ${amountNum.toLocaleString("en-IN")}`;
    drawRow("Order Amount:", amountStr);

    y += 4;

    // ── Terms section
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Terms & Conditions", 20, y);
    y += 8;
    
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85); // slate-700
    
    const renderTerm = (num: string, title: string, content: string) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${num}. `, 20, y);
        const numWidth = doc.getTextWidth(`${num}. `);
        
        doc.text(`${title}: `, 20 + numWidth, y);
        const titleWidth = doc.getTextWidth(`${title}: `);
        
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(content, pageWidth - 20 - numWidth - titleWidth - 20);
        doc.text(lines, 20 + numWidth + titleWidth, y);
        y += lines.length * 5 + 3;
    };

    renderTerm("1", "License Grant", `The Licensee is granted the right to use "${data.assetName}" under the agreed terms.`);
    renderTerm("2", "Restrictions", "Redistribution or resale is prohibited.");
    renderTerm("3", "Warranty Disclaimer", "The asset is provided 'as is', without warranties.");
    renderTerm("4", "Non-Transferable", "This license is non-transferable without CODEXCHANGE approval.");
    renderTerm("5", "Revocation Clause", "Breach of terms may result in license termination.");

    y += 15;

    // ── Signature Area (Bottom Left)
    doc.setFontSize(32);
    doc.setFont("times", "italic"); // Using times italic as a cursive substitute
    doc.setTextColor(51, 65, 85);
    doc.text("Codexchange", 20, y);
    y += 4;
    
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.line(20, y, 90, y);
    y += 5;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("Authorized by ", 20, y);
    const authWidth = doc.getTextWidth("Authorized by ");
    doc.setFont("helvetica", "bold");
    doc.text("CODEXCHANGE", 20 + authWidth, y);
    
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("Digital License Authority", 20, y);


    // ── Footer
    y = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "italic");
    const footerText = "Generated via CODEXCHANGE Marketplace";
    doc.text(footerText, (pageWidth - doc.getTextWidth(footerText)) / 2, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(`Document ID: ${data.licenseKey}`, pageWidth - 20, pageHeight - 25, { align: "right" });

    // Save PDF
    const safeAssetName = data.assetName.replace(/[^a-zA-Z0-9 -]/g, "").trim().replace(/\s+/g, "-");
    const licenseTypeCap = data.licenseType.charAt(0).toUpperCase() + data.licenseType.slice(1);
    doc.save(`CODEXCHANGE-License-${licenseTypeCap}-${safeAssetName}.pdf`);
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function LicenseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const licenseId = params.id as string;

    // State
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferEmail, setTransferEmail] = useState("");

    // tRPC queries
    const {
        data: license,
        isLoading,
        error,
    } = api.license.getById.useQuery(
        { licenseId },
        { enabled: !!licenseId }
    );

    // tRPC mutations
    const downloadMutation = api.license.generateDownloadUrl.useMutation({
        onSuccess: (data) => {
            window.open(data.url, "_blank");
            showToast("Download started!", "success");
        },
        onError: (err) => {
            showToast(err.message || "Failed to generate download link", "error");
        },
    });

    const pdfQuery = api.license.getLicensePdfData.useQuery(
        { licenseId },
        { enabled: false } // manually triggered
    );

    const deactivateMutation = api.license.deactivateLicense.useMutation({
        onSuccess: (data) => {
            setShowDeactivateModal(false);
            showToast(data.message, "info");
        },
        onError: (err) => {
            showToast(err.message || "Failed to deactivate license", "error");
        },
    });

    const transferMutation = api.license.transferLicense.useMutation({
        onSuccess: (data) => {
            setShowTransferModal(false);
            setTransferEmail("");
            showToast(data.message, "info");
        },
        onError: (err) => {
            showToast(err.message || "Failed to transfer license", "error");
        },
    });

    // Helpers
    const showToast = useCallback((message: string, type: ToastType) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    const handleCopyKey = useCallback(async () => {
        if (!license?.licenseKey) return;
        try {
            await navigator.clipboard.writeText(license.licenseKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            showToast("Failed to copy to clipboard", "error");
        }
    }, [license?.licenseKey, showToast]);

    const handleDownload = useCallback(() => {
        downloadMutation.mutate({ licenseId });
    }, [downloadMutation, licenseId]);

    const handleDownloadPdf = useCallback(async () => {
        try {
            const { data } = await pdfQuery.refetch();
            if (data) {
                await generateLicensePdf(data);
                showToast("License agreement PDF downloaded!", "success");
            }
        } catch {
            showToast("Failed to generate license PDF", "error");
        }
    }, [pdfQuery, showToast]);

    const handleDeactivate = useCallback(() => {
        deactivateMutation.mutate({ licenseId });
    }, [deactivateMutation, licenseId]);

    const handleTransfer = useCallback(() => {
        if (!transferEmail.trim()) {
            showToast("Please enter a valid email address", "error");
            return;
        }
        transferMutation.mutate({ licenseId, targetEmail: transferEmail.trim() });
    }, [transferMutation, licenseId, transferEmail, showToast]);

    // Status helpers
    const getStatusBadge = (status: string) => {
        const map: Record<string, { variant: "success" | "warning" | "danger" | "default"; label: string }> = {
            active: { variant: "success", label: "Active" },
            expired: { variant: "warning", label: "Expired" },
            revoked: { variant: "danger", label: "Revoked" },
            paid: { variant: "success", label: "paid" },
        };
        const config = map[status] ?? { variant: "default", label: status };
        return <Badge variant={config.variant as any} size="lg">{config.label}</Badge>;
    };

    const formatDate = (date: string | Date | null) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // ─── Loading State ──────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950">
                <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                        <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800 mb-6" />
                        <div className="h-8 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    </div>
                </div>
                <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 animate-pulse rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ─── Error State ────────────────────────────────────────────
    if (error || !license) {
        return (
            <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950">
                <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
                <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
                    <div className="text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 ring-4 ring-red-50 dark:ring-red-500/5">
                            <AlertTriangle className="h-8 w-8 text-red-500 dark:text-red-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">License Not Found</h2>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">
                            {error?.message || "This license doesn't exist or you don't have access to it."}
                        </p>
                        <Button
                            className="mt-6"
                            onClick={() => router.push("/dashboard")}
                        >
                            Go to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Render ─────────────────────────────────────────────────
    const asset = license.asset;
    const isActive = license.status === "active";

    return (
        <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950">
            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Deactivate Modal */}
            <Modal
                open={showDeactivateModal}
                onClose={() => setShowDeactivateModal(false)}
                title="Deactivate License"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-500/10 p-4 border border-red-200 dark:border-red-500/20">
                        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-500" />
                        <div>
                            <p className="text-sm font-medium text-red-800 dark:text-red-300">
                                Are you sure you want to deactivate this license?
                            </p>
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                This action will revoke your access to the asset downloads.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="ghost"
                            onClick={() => setShowDeactivateModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDeactivate}
                            isLoading={deactivateMutation.isPending}
                        >
                            <ShieldOff className="mr-2 h-4 w-4" />
                            Deactivate
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Transfer Modal */}
            <Modal
                open={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                title="Transfer License"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Enter the email address of the person you want to transfer this license to.
                    </p>
                    <div>
                        <label
                            htmlFor="transfer-email"
                            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                            Recipient Email
                        </label>
                        <input
                            id="transfer-email"
                            type="email"
                            value={transferEmail}
                            onChange={(e) => setTransferEmail(e.target.value)}
                            placeholder="recipient@example.com"
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowTransferModal(false);
                                setTransferEmail("");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleTransfer}
                            isLoading={transferMutation.isPending}
                        >
                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                            Transfer
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Header */}
            <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                    <Link
                        href="/dashboard"
                        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
                                {asset?.name || "License Details"}
                            </h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {asset?.category?.name && (
                                    <span>{asset.category.name} • </span>
                                )}
                                Built by{" "}
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                    {asset?.builder?.fullName || "Unknown"}
                                </span>
                            </p>
                        </div>
                        <div className="hidden sm:block">
                            {getStatusBadge(license.status)}
                        </div>
                    </div>
                    <div className="mt-4 sm:hidden">
                        {getStatusBadge(license.status)}
                    </div>
                </div>
            </div>

            {/* Content gap-6 provides vertical spacing */}
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="space-y-6">
                    {/* ── License Info Card ─────────────────────────────── */}
                    <Card variant="bordered" className="overflow-hidden shadow-sm dark:shadow-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 pb-4">
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    License Information
                                </h2>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                {/* License Key */}
                                <div className="sm:col-span-2">
                                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        License Key
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 p-3 font-mono text-sm font-semibold text-slate-800 tracking-wide dark:bg-slate-950 dark:text-slate-300">
                                            {license.licenseKey}
                                        </code>
                                        <button
                                            onClick={handleCopyKey}
                                            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 transition-all hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
                                            title="Copy license key"
                                        >
                                            {copied ? (
                                                <Check className="h-5 w-5 text-green-600 dark:text-green-500" />
                                            ) : (
                                                <Copy className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* License Type */}
                                <div>
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        License Type
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Key className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                        <span className="font-medium capitalize text-slate-800 dark:text-slate-200">
                                            {license.licenseType} License
                                        </span>
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Status
                                    </p>
                                    <div className="mt-1">
                                        {getStatusBadge(license.status)}
                                    </div>
                                </div>

                                {/* Activated Date */}
                                <div>
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Activated
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                                            {formatDate(license.activatedAt)}
                                        </span>
                                    </div>
                                </div>

                                {/* Expiry Date */}
                                <div>
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Expires
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                                            {license.expiresAt
                                                ? formatDate(license.expiresAt)
                                                : "Perpetual (No Expiry)"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Downloads Card ────────────────────────────────── */}
                    <Card variant="bordered" className="overflow-hidden shadow-sm dark:shadow-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 pb-4">
                            <div className="flex items-center gap-2">
                                <Download className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    Downloads
                                </h2>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {!isActive ? (
                                <div className="rounded-xl border border-yellow-200 dark:border-yellow-500/20 bg-yellow-50 dark:bg-yellow-500/10 p-5 text-center">
                                    <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-yellow-600 dark:text-yellow-500" />
                                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                                        Downloads are only available for active licenses.
                                    </p>
                                    <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400/80">
                                        Your license is currently {license.status}.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Asset Files Download */}
                                    <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/10 ring-4 ring-blue-50 dark:ring-blue-500/5">
                                                <Package className="h-6 w-6 text-blue-600 dark:text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                    Asset Files
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    Download the {" "}
                                                    <span className="capitalize">{license.licenseType}</span>{" "}
                                                    package ZIP
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleDownload}
                                            isLoading={downloadMutation.isPending}
                                        >
                                            {downloadMutation.isPending ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Preparing...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Download
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    {/* License Agreement PDF */}
                                    <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/10 ring-4 ring-indigo-50 dark:ring-indigo-500/5">
                                                <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                    License Agreement
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    Auto-generated PDF document
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleDownloadPdf}
                                            isLoading={pdfQuery.isFetching}
                                        >
                                            <FileText className="mr-2 h-4 w-4" />
                                            Download PDF
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── Actions Card ──────────────────────────────────── */}
                    <Card variant="bordered" className="overflow-hidden shadow-sm dark:shadow-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 pb-4">
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    Manage License
                                </h2>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    variant="danger"
                                    onClick={() => setShowDeactivateModal(true)}
                                    disabled={!isActive}
                                >
                                    <ShieldOff className="mr-2 h-4 w-4" />
                                    Deactivate
                                </Button>
                                <Button
                                            // Removing 'variant="outline"' to use standard primary solid contrast
                                            onClick={() => setShowTransferModal(true)}
                                            disabled={!isActive}
                                        >
                                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                                            Transfer
                                        </Button>
                                {asset?.demoUrl && (
                                    <div className="ml-auto">
                                        <a
                                            href={asset.demoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button variant="ghost">
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                View Source / Demo
                                            </Button>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Order Details Card ────────────────────────────── */}
                    {license.order && (
                        <Card variant="bordered" className="overflow-hidden shadow-sm dark:shadow-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 pb-4">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    Order Summary
                                </h2>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Amount Paid
                                        </p>
                                        <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                                            {parseFloat(license.order.amountTotal) === 0
                                                ? "Free"
                                                : `₹${parseFloat(license.order.amountTotal).toLocaleString("en-IN")}`}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Order Status
                                        </p>
                                        <div className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100 capitalize">
                                            {license.order.status}
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Order Date
                                        </p>
                                        <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                                            {formatDate(license.order.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Slide-up animation for toasts */}
            <style jsx global>{`
                @keyframes slideUp {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slide-up {
                    animation: slideUp 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
