"use client";

import { useState } from "react";
import { Check, ClipboardList } from "lucide-react";
import { ScarcityIndicator } from "./scarcity-indicator";
import { CheckoutModal, type LicenseOption } from "./checkout-modal";
import { api } from "@/utils/trpc/client";
import Link from "next/link";

export interface PricingCardProps {
    licenseType: "usage" | "source";
    price: number;
    scarcity: {
        total: number;
        remaining: number;
    };
    features: string[];
    assetId: string;
    assetName: string;
    /** The other license, so the modal can offer both in Step 1 */
    otherLicense?: {
        licenseType: "usage" | "source";
        price: number;
        scarcity: { total: number; remaining: number };
        features: string[];
    } | null;
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
    assetName,
    otherLicense,
}: PricingCardProps) {
    const config = licenseConfig[licenseType];
    const [showCheckout, setShowCheckout] = useState(false);

    const thisLicenseOption: LicenseOption = {
        price,
        features,
        remaining: scarcity.remaining,
        total: scarcity.total,
    };

    const otherLicenseOption: LicenseOption | null = otherLicense
        ? {
            price: otherLicense.price,
            features: otherLicense.features,
            remaining: otherLicense.scarcity.remaining,
            total: otherLicense.scarcity.total,
        }
        : null;

    const usageLicense =
        licenseType === "usage" ? thisLicenseOption : otherLicenseOption ?? null;
    const sourceLicense =
        licenseType === "source" ? thisLicenseOption : otherLicenseOption ?? null;

    const { data: ownership } = api.license.checkOwnership.useQuery(
        { assetId },
        { 
            retry: false,
            refetchOnWindowFocus: false 
        }
    );

    const isOwned = ownership?.owned;
    const ownedType = ownership?.licenseType;

    let buttonLabel = scarcity.remaining === 0 ? "Sold Out" : `Get ${config.title}`;
    let isDisabled = scarcity.remaining === 0;
    let showDashboardLink = false;

    if (isOwned) {
        if (ownedType === "source") {
            buttonLabel = "Already Owned";
            isDisabled = true;
            showDashboardLink = true;
        } else if (ownedType === "usage") {
            if (licenseType === "usage") {
                buttonLabel = "Already Owned";
                isDisabled = true;
                showDashboardLink = true;
            } else {
                buttonLabel = "Upgrade to Source";
            }
        }
    }

    return (
        <>
            <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-white/3">
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                        {config.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-500">
                        {config.description}
                    </p>
                </div>

                <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        ₹{price.toLocaleString()}
                    </span>
                    <span className="ml-2 text-gray-500 dark:text-slate-500">one-time</span>
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
                            <span className="text-sm text-gray-700 dark:text-slate-400">
                                {feature}
                            </span>
                        </li>
                    ))}
                </ul>

                {showDashboardLink ? (
                    <Link href="/dashboard" className="mt-auto">
                        <button
                            type="button"
                            className="flex w-full items-center justify-center rounded-xl border border-indigo-600 bg-transparent px-4 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 dark:hover:bg-indigo-600/10 focus:outline-none"
                        >
                            <ClipboardList className="mr-2 h-4 w-4" />
                            View in Dashboard
                        </button>
                    </Link>
                ) : (
                    <button
                        type="button"
                        onClick={() => setShowCheckout(true)}
                        disabled={isDisabled}
                        className="mt-auto flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none"
                    >
                        {buttonLabel}
                    </button>
                )}
            </div>

            <CheckoutModal
                isOpen={showCheckout}
                onClose={() => setShowCheckout(false)}
                assetId={assetId}
                assetName={assetName}
                usageLicense={usageLicense}
                sourceLicense={sourceLicense}
                defaultLicenseType={licenseType}
            />
        </>
    );
}
