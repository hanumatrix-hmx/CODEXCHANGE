"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle, Copy, Download, Github, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/trpc/client";

interface OrderData {
    status: string;
    order?: {
        id: string;
        licenseType: "usage" | "source";
        asset?: {
            name: string;
            githubUrl?: string | null;
            slug?: string;
        };
    };
    license?: {
        id: string;
        licenseKey: string;
    };
}

function PaymentVerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get("order_id");

    const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "failed">("loading");
    const [orderData, setOrderData] = useState<OrderData | null>(null);
    const [copied, setCopied] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const verifyPayment = api.payment.verifyPayment.useMutation();
    const generateDownloadUrl = api.license.generateDownloadUrl.useMutation();

    useEffect(() => {
        if (!orderId) {
            router.push("/");
            return;
        }

        verifyPayment.mutate(
            { orderId },
            {
                onSuccess: (data: any) => {
                    if (data.status === "SUCCESS") {
                        setVerificationStatus("success");
                        setOrderData(data);
                    } else {
                        setVerificationStatus("failed");
                    }
                },
                onError: () => {
                    setVerificationStatus("failed");
                },
            }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = async () => {
        if (!orderData?.license?.id || isDownloading) return;
        setIsDownloading(true);
        try {
            const res = await generateDownloadUrl.mutateAsync({ licenseId: orderData.license.id });
            if (res.url && res.url !== "#") {
                window.open(res.url, "_blank");
            } else {
                alert("Download link will be available soon.");
            }
        } catch (error) {
            console.error("Download error", error);
            alert("Failed to generate download link.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleAccessSource = () => {
        const githubUrl = orderData?.order?.asset?.githubUrl;
        if (githubUrl) {
            window.open(githubUrl, "_blank");
        }
    };

    if (verificationStatus === "loading") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 animate-in fade-in duration-500">
                <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Verifying Payment
                    </h2>
                    <p className="max-w-[280px] text-slate-500 dark:text-slate-400">
                        Please wait while we confirm your transaction securely...
                    </p>
                </div>
            </div>
        );
    }

    if (verificationStatus === "success") {
        const licenseKey = orderData?.license?.licenseKey;
        const assetName = orderData?.order?.asset?.name || "Premium Asset";
        const isSourceLicense = orderData?.order?.licenseType === "source";
        const githubUrl = orderData?.order?.asset?.githubUrl;

        return (
            <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-transparent p-4 animate-in fade-in slide-in-from-bottom-4 duration-700 sm:p-6 lg:p-8">
                <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl">
                    <div className="flex flex-col items-center pb-6 p-8 text-center">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/10 ring-4 ring-green-50 dark:ring-green-500/5">
                            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-500" />
                        </div>
                        <h1 className="mb-2 text-3xl font-extrabold tracking-tight">Payment Successful</h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Thank you for purchasing <span className="font-semibold text-slate-900 dark:text-slate-100">{assetName}</span>
                        </p>
                    </div>

                    <div className="px-8 py-2">
                        <div className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 p-5">
                            <div>
                                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    {isSourceLicense ? "Source License Key" : "Usage License Key"}
                                </p>
                                <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 flex-wrap sm:flex-nowrap">
                                    <code className="relative truncate rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        {licenseKey || "Generating key..."}
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 shrink-0 dark:hover:bg-slate-800"
                                        onClick={() => licenseKey && handleCopy(licenseKey)}
                                        disabled={!licenseKey}
                                        title="Copy License Key"
                                    >
                                        {copied ? <Check className="h-4 w-4 text-green-600 dark:text-green-500" /> : <Copy className="h-4 w-4 text-slate-500 dark:text-slate-400" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 p-8 pt-6">
                        {isSourceLicense && githubUrl ? (
                            <Button onClick={handleAccessSource} className="h-12 w-full text-base font-medium shadow-sm flex items-center justify-center" size="lg">
                                <Github className="mr-2 h-5 w-5" />
                                Access Source Code
                            </Button>
                        ) : (
                            <Button
                                onClick={handleDownload}
                                disabled={isDownloading || !orderData?.license}
                                className="h-12 w-full text-base font-medium shadow-sm flex items-center justify-center"
                                size="lg"
                            >
                                {isDownloading ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <Download className="mr-2 h-5 w-5" />
                                )}
                                {isDownloading ? "Preparing..." : "Download Asset"}
                            </Button>
                        )}

                        <div className="grid grid-flow-col gap-3 pt-2">
                            <Button onClick={() => router.push("/dashboard")} variant="outline" className="h-11 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100">
                                Dashboard
                            </Button>
                            <Button onClick={() => router.push("/browse")} variant="outline" className="h-11 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100">
                                Browse More
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-transparent p-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-full max-w-md rounded-2xl border border-red-200 dark:border-red-900/30 bg-white dark:bg-slate-900 p-8 text-center shadow-xl text-slate-900 dark:text-slate-100">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10 ring-4 ring-red-50 dark:ring-red-500/5">
                    <XCircle className="h-10 w-10 text-red-600 dark:text-red-500" />
                </div>
                <h1 className="mb-3 text-3xl font-extrabold tracking-tight">Payment Failed</h1>
                <p className="mb-8 text-slate-500 dark:text-slate-400">
                    We couldn&apos;t confirm your payment. Your account has not been charged, or the transaction is still pending.
                </p>

                <div className="space-y-3">
                    <Button onClick={() => window.location.reload()} className="h-11 w-full text-base flex items-center justify-center" size="lg">
                        Check Status Again
                    </Button>
                    <Button onClick={() => router.push("/dashboard")} variant="outline" className="h-11 w-full text-base dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 flex items-center justify-center">
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
}

function LoadingFallback() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <div className="space-y-4 text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
                <p className="animate-pulse font-medium text-slate-500 dark:text-slate-400">Loading secure payment portal...</p>
            </div>
        </div>
    );
}

export default function PaymentVerifyPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <PaymentVerifyContent />
        </Suspense>
    );
}
