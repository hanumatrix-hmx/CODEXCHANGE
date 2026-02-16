"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentSessionId: string;
    orderId: string;
    orderAmount: number;
}

declare global {
    interface Window {
        Cashfree: any;
    }
}

export function CheckoutModal({
    isOpen,
    onClose,
    paymentSessionId,
    orderId,
    orderAmount,
}: CheckoutModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Load Cashfree SDK
        if (!document.getElementById("cashfree-sdk")) {
            const script = document.createElement("script");
            script.id = "cashfree-sdk";
            script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    const handlePayment = async () => {
        try {
            setIsLoading(true);

            // Initialize Cashfree
            const cashfree = await window.Cashfree({
                mode: process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT || "sandbox",
            });

            // Open checkout
            const checkoutOptions = {
                paymentSessionId: paymentSessionId,
                returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify?order_id=${orderId}`,
            };

            await cashfree.checkout(checkoutOptions);
        } catch (error) {
            console.error("Payment error:", error);
            alert("Failed to open payment checkout. Please try again.");
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                >
                    <X className="h-5 w-5" />
                </button>

                <h2 className="mb-4 text-2xl font-bold text-gray-900">Complete Payment</h2>

                <div className="mb-6 space-y-3">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Order ID:</span>
                        <span className="font-mono text-sm text-gray-900">{orderId}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="text-xl font-bold text-gray-900">
                            ₹{orderAmount.toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="space-y-3">
                    <Button
                        onClick={handlePayment}
                        disabled={isLoading}
                        className="w-full"
                        size="lg"
                    >
                        {isLoading ? "Opening Checkout..." : "Proceed to Payment"}
                    </Button>
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="w-full"
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                </div>

                <p className="mt-4 text-center text-xs text-gray-500">
                    Powered by Cashfree Payments
                </p>
            </div>
        </div>
    );
}
