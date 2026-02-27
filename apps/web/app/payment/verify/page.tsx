"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/trpc/client";

function PaymentVerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get("order_id");

    const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "failed">("loading");
    const [licenseKey, setLicenseKey] = useState<string | null>(null);

    const verifyPayment = api.payment.verifyPayment.useMutation();

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
                        setLicenseKey(data.license?.licenseKey || null);
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

    if (verificationStatus === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
                    <h2 className="mt-4 text-xl font-semibold text-gray-900">
                        Verifying Payment...
                    </h2>
                    <p className="mt-2 text-gray-600">Please wait while we confirm your payment</p>
                </div>
            </div>
        );
    }

    if (verificationStatus === "success") {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="max-w-md text-center">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
                    <h1 className="mt-4 text-3xl font-bold text-gray-900">Payment Successful!</h1>
                    <p className="mt-2 text-gray-600">
                        Your license has been activated successfully.
                    </p>

                    {licenseKey && (
                        <div className="mt-6 rounded-lg bg-gray-50 p-4">
                            <p className="text-sm font-medium text-gray-700">License Key:</p>
                            <p className="mt-1 font-mono text-sm text-gray-900">{licenseKey}</p>
                        </div>
                    )}

                    <div className="mt-8 space-y-3">
                        <Button onClick={() => router.push("/dashboard")} className="w-full">
                            Go to Dashboard
                        </Button>
                        <Button
                            onClick={() => router.push("/browse")}
                            variant="outline"
                            className="w-full"
                        >
                            Browse More Assets
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="max-w-md text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                    <X className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="mt-4 text-3xl font-bold text-gray-900">Payment Failed</h1>
                <p className="mt-2 text-gray-600">
                    We couldn&apos;t process your payment. Please try again.
                </p>

                <div className="mt-8 space-y-3">
                    <Button onClick={() => router.push("/browse")} className="w-full">
                        Try Again
                    </Button>
                    <Button
                        onClick={() => router.push("/dashboard")}
                        variant="outline"
                        className="w-full"
                    >
                        Go to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
}

function LoadingFallback() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
                <p className="mt-4 text-gray-600">Loading...</p>
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
