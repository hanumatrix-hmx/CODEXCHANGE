"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "./ui/button";
import { ScarcityIndicator } from "./scarcity-indicator";
import { CheckoutModal } from "./checkout-modal";
import { api } from "@/utils/trpc/client";

export interface PricingCardProps {
    licenseType: "usage" | "source";
    price: number;
    scarcity: {
        total: number;
        remaining: number;
    };
    features: string[];
    assetId: string;
}

const licenseConfig = {
    usage: {
        title: "Usage License",
        description: "Deploy and use the tool for your projects",
    },
    source: {
        title: "Source Code License",
        description: "Full source code access with modification rights",
    },
};

export function PricingCard({
    licenseType,
    price,
    scarcity,
    features,
    assetId,
}: PricingCardProps) {
    const config = licenseConfig[licenseType];
    const [showCheckout, setShowCheckout] = useState(false);
    const [orderDetails, setOrderDetails] = useState<{
        orderId: string;
        paymentSessionId: string;
        orderAmount: number;
    } | null>(null);

    const createOrder = api.payment.createOrder.useMutation();

    const handleBuyClick = async () => {
        try {
            const result = await createOrder.mutateAsync({
                assetId,
                licenseType,
            });

            setOrderDetails(result);
            setShowCheckout(true);
        } catch (error) {
            console.error("Failed to create order:", error);
            alert("Failed to create order. Please try again.");
        }
    };

    return (
        <>
            <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{config.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{config.description}</p>
                </div>

                <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">₹{price.toLocaleString()}</span>
                    <span className="ml-2 text-gray-500">one-time</span>
                </div>

                <div className="mb-6">
                    <ScarcityIndicator
                        total={scarcity.total}
                        remaining={scarcity.remaining}
                        licenseType={licenseType}
                    />
                </div>

                <ul className="mb-6 space-y-3">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                            <Check className="mr-2 h-5 w-5 flex-shrink-0 text-green-600" />
                            <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                    ))}
                </ul>

                <Button
                    onClick={handleBuyClick}
                    disabled={createOrder.isPending || scarcity.remaining === 0}
                    className="mt-auto w-full"
                    size="lg"
                >
                    {scarcity.remaining === 0
                        ? "Sold Out"
                        : createOrder.isPending
                            ? "Creating Order..."
                            : `Buy ${config.title}`}
                </Button>
            </div>

            {orderDetails && (
                <CheckoutModal
                    isOpen={showCheckout}
                    onClose={() => setShowCheckout(false)}
                    paymentSessionId={orderDetails.paymentSessionId}
                    orderId={orderDetails.orderId}
                    orderAmount={orderDetails.orderAmount}
                />
            )}
        </>
    );
}
