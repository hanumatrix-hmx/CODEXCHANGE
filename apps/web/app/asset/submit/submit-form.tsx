"use client";

import { useActionState } from "react";
import { submitAsset, updateAsset, type FormState } from "./actions";
import { useState } from "react";
import TagInput from "./tag-input";
import ImageGallery from "./image-gallery";
import React from "react";

const initialState: FormState = {
    error: {},
    message: null,
};

const InfoTooltip = ({ title, text }: { title?: string, text: React.ReactNode }) => (
    <div className="relative group flex items-center ml-2">
        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 text-[10px] font-bold cursor-default select-none transition-colors">i</span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-xl bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-sm text-white dark:text-gray-200 text-xs p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
            {title && <p className="font-semibold mb-1 text-white">{title}</p>}
            <div className="text-gray-200 text-xs font-normal leading-relaxed">{text}</div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900/95 dark:border-t-gray-800/95"></div>
        </div>
    </div>
);

const PLATFORM_FEE_PERCENTAGE = 0.16;
const GST_ON_FEE_PERCENTAGE = 0.18;

function calculateEarnings(price: number) {
    if (!price || isNaN(price) || price < 0) return null;

    const platformFee = price * PLATFORM_FEE_PERCENTAGE;
    const gstOnFee = platformFee * GST_ON_FEE_PERCENTAGE;
    const totalDeduction = platformFee + gstOnFee;
    const builderEarnings = price - totalDeduction;

    return {
        platformFee,
        gstOnFee,
        totalDeduction,
        builderEarnings
    };
}

const MAX_IMAGE_SIZE_MB = 4;
const MAX_FILE_SIZE_MB = 50;

const VALIDITY_PRESETS = [
    { label: "6 Months", days: 180 },
    { label: "1 Year", days: 365 },
    { label: "2 Years", days: 730 },
    { label: "Perpetual", days: 0 },
];

function formatDaysAsMonths(days: number): string {
    if (days <= 0) return "Perpetual (no expiry)";
    const months = days / 30;
    if (months < 1) return `${days} day${days !== 1 ? "s" : ""}`;
    const rounded = Math.round(months * 10) / 10;
    return `≈ ${rounded} month${rounded !== 1 ? "s" : ""}`;
}

export default function SubmitAssetForm({ categories, initialData }: { categories: any[], initialData?: any }) {
    const isEditing = !!initialData;
    const action = isEditing ? updateAsset : submitAsset;
    const [state, formAction, isPending] = useActionState(action, initialState);

    const [usageLicensePrice, setUsageLicensePrice] = useState<string>(initialData?.usageLicensePrice || "");
    const [sourceLicensePrice, setSourceLicensePrice] = useState<string>(initialData?.sourceLicensePrice || "");
    const [usageFeaturesText, setUsageFeaturesText] = useState<string>(initialData?.licenseFeatures?.usage?.join('\n') || "Deploy to production\nUnlimited end users\nTechnical support\nUpdates for 1 year");
    const [sourceFeaturesText, setSourceFeaturesText] = useState<string>(initialData?.licenseFeatures?.source?.join('\n') || "Full source code access\nModify and customize\nLifetime updates\nPriority support");

    // License validity state
    const [usageValidityDays, setUsageValidityDays] = useState<string>(initialData?.usageLicenseValidityDays?.toString() || "365");
    const [sourceValidityDays, setSourceValidityDays] = useState<string>(initialData?.sourceLicenseValidityDays?.toString() || "0");
    const [usageValidityMode, setUsageValidityMode] = useState<string>(() => {
        const v = initialData?.usageLicenseValidityDays;
        if (v === null || v === undefined || v === 0) return "0";
        if (VALIDITY_PRESETS.some(p => p.days === v)) return String(v);
        return "custom";
    });
    const [sourceValidityMode, setSourceValidityMode] = useState<string>(() => {
        const v = initialData?.sourceLicenseValidityDays;
        if (v === null || v === undefined || v === 0) return "0";
        if (VALIDITY_PRESETS.some(p => p.days === v)) return String(v);
        return "custom";
    });

    // File upload state
    const [assetFile, setAssetFile] = useState<File | null>(null);
    const existingFilePath = initialData?.fileStoragePath || null;

    const [galleryHasError, setGalleryHasError] = useState<boolean>(!isEditing);
    const [submitAttempted, setSubmitAttempted] = useState<boolean>(false);

    // Add states for tracking dirty status
    const [imagesChanged, setImagesChanged] = useState<boolean>(false);
    const [formChanged, setFormChanged] = useState<boolean>(false);

    const initialImages = React.useMemo(() => {
        if (!initialData?.listingImages) return [];
        return [...initialData.listingImages]
            .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
            .map((img: any) => ({
                id: img.id,
                type: "existing" as const,
                url: img.url
            }));
    }, [initialData]);

    const hasImageErrors = galleryHasError;

    const handleFormChange = () => {
        if (!isEditing) return; // Only care about changes during editing
        setFormChanged(true);
    };

    const isSaveDisabled = isEditing && !formChanged && !imagesChanged;

    const inputClasses = "block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-gray-900 dark:focus:border-white focus:ring-gray-900 dark:focus:ring-white focus:bg-white dark:focus:bg-white/10 transition-all shadow-sm";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center";

    return (
        <form action={formAction} className="space-y-8" onChange={handleFormChange} onSubmit={(e) => { setSubmitAttempted(true); if (hasImageErrors) e.preventDefault(); }}>
            {state?.error?._form && (
                <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/20 p-4 backdrop-blur-sm">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                                {state.error._form}
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            {isEditing && <input type="hidden" name="assetId" value={initialData.id} />}

            <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                {/* Basic Info */}
                <div className="sm:col-span-2">
                    <label htmlFor="name" className={labelClasses}>
                        Asset Name
                    </label>
                    <div className="mt-2">
                        <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            defaultValue={initialData?.name}
                            placeholder="e.g. AutoGPT Pro"
                            className={inputClasses}
                        />
                    </div>
                    {state?.error?.name && (
                        <p className="mt-1 text-sm text-red-600">{state.error.name}</p>
                    )}
                </div>

                <div className="sm:col-span-1">
                    <label htmlFor="slug" className={labelClasses}>
                        URL Slug
                        <InfoTooltip title="🔗 URL Slug" text="This is the web address for your asset (e.g., /asset/your-slug). It cannot be changed once created. Use lowercase letters, numbers, and hyphens." />
                    </label>
                    <div className="mt-2">
                        <input
                            type="text"
                            name="slug"
                            id="slug"
                            required
                            defaultValue={initialData?.slug}
                            readOnly={isEditing}
                            placeholder="autogpt-pro"
                            className={`${inputClasses} ${isEditing ? "bg-gray-100/50 dark:bg-white/5 cursor-not-allowed opacity-75" : ""}`}
                        />
                    </div>
                    {state?.error?.slug && (
                        <p className="mt-1 text-sm text-red-600">{state.error.slug}</p>
                    )}
                </div>

                <div className="sm:col-span-1">
                    <label htmlFor="categoryId" className={labelClasses}>
                        Category
                    </label>
                    <div className="mt-2">
                        <select
                            id="categoryId"
                            name="categoryId"
                            required
                            defaultValue={initialData?.categoryId || ""}
                            className={inputClasses}
                        >
                            <option value="" className="text-gray-900 dark:text-gray-100 dark:bg-gray-900">Select a category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id} className="text-gray-900 dark:text-gray-100 dark:bg-gray-900">
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {state?.error?.categoryId && (
                        <p className="mt-1 text-sm text-red-600">{state.error.categoryId}</p>
                    )}
                </div>

                {/* Descriptions */}
                <div className="sm:col-span-2">
                    <label htmlFor="description" className={labelClasses}>
                        Short Description
                    </label>
                    <div className="mt-2">
                        <input
                            type="text"
                            name="description"
                            id="description"
                            required
                            defaultValue={initialData?.description}
                            placeholder="A brief summary of what your tool does"
                            className={inputClasses}
                        />
                    </div>
                    {state?.error?.description && (
                        <p className="mt-1 text-sm text-red-600">{state.error.description}</p>
                    )}
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="longDescription" className={labelClasses}>
                        Long Description (Markdown)
                    </label>
                    <div className="mt-2">
                        <textarea
                            id="longDescription"
                            name="longDescription"
                            rows={8}
                            defaultValue={initialData?.longDescription || ""}
                            placeholder="Detailed explanation, features, and setup instructions..."
                            className={inputClasses}
                        />
                    </div>
                </div>

                {/* Pricing & Tech */}
                <div className="sm:col-span-1 border border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 rounded-2xl p-6 backdrop-blur-sm shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                    <label htmlFor="usageLicensePrice" className={labelClasses}>
                        Usage License Price (₹)
                        <InfoTooltip title="🔒 Usage License" text={<>Buyer can use your tool as-is. They get access to deploy and run it, technical support, and updates &mdash; but <strong>no access to the source code</strong>. They cannot modify, resell, or redistribute it.</>} />
                    </label>
                    <div className="mt-3 relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <span className="text-gray-500 font-medium">₹</span>
                        </div>
                        <input
                            type="text"
                            name="usageLicensePrice"
                            id="usageLicensePrice"
                            required
                            placeholder="0.00"
                            value={usageLicensePrice}
                            onChange={(e) => { setUsageLicensePrice(e.target.value); handleFormChange(); }}
                            className={`${inputClasses} pl-8`}
                        />
                    </div>
                    {(() => {
                        const price = parseFloat(usageLicensePrice);
                        const earnings = calculateEarnings(price);
                        if (earnings) {
                            return (
                                <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm backdrop-blur-sm">
                                    <div className="flex justify-between py-1"><span>Buyer Pays:</span> <span className="font-medium text-gray-900 dark:text-gray-100">₹{price.toFixed(2)}</span></div>
                                    <div className="flex justify-between py-1 text-gray-500 dark:text-gray-400"><span>Platform Fee (16%):</span> <span>−₹{earnings.platformFee.toFixed(2)}</span></div>
                                    <div className="flex justify-between py-1 text-gray-500 dark:text-gray-400"><span>GST on Fee (18%):</span> <span>−₹{earnings.gstOnFee.toFixed(2)}</span></div>
                                    <div className="flex justify-between font-bold border-t border-gray-100 dark:border-white/10 mt-2 pt-2 text-gray-900 dark:text-white text-base"><span>You Get:</span> <span>₹{earnings.builderEarnings.toFixed(2)}</span></div>
                                </div>
                            );
                        }
                        return <p className="mt-2 text-xs text-gray-500 ml-1">Use 0 for free assets.</p>;
                    })()}
                    {state?.error?.usageLicensePrice && (
                        <p className="mt-1 text-sm text-red-600">{state.error.usageLicensePrice}</p>
                    )}

                    {/* Usage Features */}
                    <div className="mt-5 pt-5 border-t border-gray-200/60 dark:border-white/10">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Included Usage Features</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Add features separated by a new line. We&apos;ve added some suggestions below.</p>
                        <textarea
                            value={usageFeaturesText}
                            onChange={(e) => { setUsageFeaturesText(e.target.value); handleFormChange(); }}
                            className={inputClasses}
                            rows={5}
                            placeholder="Deploy to production&#10;Unlimited end users..."
                        />
                    </div>

                    {/* Usage License Validity */}
                    <div className="mt-5 pt-5 border-t border-gray-200/60 dark:border-white/10">
                        <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center`}>
                            License Validity
                            <InfoTooltip title="⏳ Validity Period" text="How long the usage license remains active after purchase. Perpetual means it never expires." />
                        </label>
                        <select
                            value={usageValidityMode}
                            onChange={(e) => {
                                const val = e.target.value;
                                setUsageValidityMode(val);
                                if (val !== "custom") {
                                    setUsageValidityDays(val);
                                } else {
                                    setUsageValidityDays(usageValidityDays === "0" ? "90" : usageValidityDays);
                                }
                                handleFormChange();
                            }}
                            className={inputClasses}
                        >
                            {VALIDITY_PRESETS.map(p => (
                                <option key={p.days} value={String(p.days)} className="text-gray-900 dark:text-gray-100 dark:bg-gray-900">{p.label}</option>
                            ))}
                            <option value="custom" className="text-gray-900 dark:text-gray-100 dark:bg-gray-900">Custom (enter days)</option>
                        </select>
                        {usageValidityMode === "custom" && (
                            <div className="mt-3">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        min="1"
                                        max="3650"
                                        value={usageValidityDays}
                                        onChange={(e) => { setUsageValidityDays(e.target.value); handleFormChange(); }}
                                        placeholder="e.g. 90"
                                        className={`${inputClasses} max-w-[140px]`}
                                    />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">days</span>
                                </div>
                                {parseInt(usageValidityDays) > 0 && (
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formatDaysAsMonths(parseInt(usageValidityDays))}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="sm:col-span-1 border border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 rounded-2xl p-6 backdrop-blur-sm shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                    <label htmlFor="sourceLicensePrice" className={labelClasses}>
                        Source License Price (₹)
                        <InfoTooltip title="📦 Source License" text={<>Buyer gets the <strong>full source code</strong> and the right to modify and customize it. Leave blank if you don&apos;t want to sell source access.</>} />
                    </label>
                    <div className="mt-3 relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <span className="text-gray-500 font-medium">₹</span>
                        </div>
                        <input
                            type="text"
                            name="sourceLicensePrice"
                            id="sourceLicensePrice"
                            placeholder="0.00"
                            value={sourceLicensePrice}
                            onChange={(e) => { setSourceLicensePrice(e.target.value); handleFormChange(); }}
                            className={`${inputClasses} pl-8`}
                        />
                    </div>
                    {(() => {
                        const price = parseFloat(sourceLicensePrice);
                        const earnings = calculateEarnings(price);
                        if (earnings) {
                            return (
                                <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm backdrop-blur-sm">
                                    <div className="flex justify-between py-1"><span>Buyer Pays:</span> <span className="font-medium text-gray-900 dark:text-gray-100">₹{price.toFixed(2)}</span></div>
                                    <div className="flex justify-between py-1 text-gray-500 dark:text-gray-400"><span>Platform Fee (16%):</span> <span>−₹{earnings.platformFee.toFixed(2)}</span></div>
                                    <div className="flex justify-between py-1 text-gray-500 dark:text-gray-400"><span>GST on Fee (18%):</span> <span>−₹{earnings.gstOnFee.toFixed(2)}</span></div>
                                    <div className="flex justify-between font-bold border-t border-gray-100 dark:border-white/10 mt-2 pt-2 text-gray-900 dark:text-white text-base"><span>You Get:</span> <span>₹{earnings.builderEarnings.toFixed(2)}</span></div>
                                </div>
                            );
                        }
                        return <p className="mt-2 text-xs text-gray-500 ml-1">Leave empty if source code is not for sale.</p>;
                    })()}

                    {/* Source Features */}
                    <div className="mt-5 pt-5 border-t border-gray-200/60 dark:border-white/10">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Included Source Features</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Add features separated by a new line. We&apos;ve added some suggestions below.</p>
                        <textarea
                            value={sourceFeaturesText}
                            onChange={(e) => { setSourceFeaturesText(e.target.value); handleFormChange(); }}
                            className={inputClasses}
                            rows={5}
                            placeholder="Full source code access&#10;Modify and customize..."
                        />
                    </div>

                    {/* Source License Validity */}
                    <div className="mt-5 pt-5 border-t border-gray-200/60 dark:border-white/10">
                        <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center`}>
                            License Validity
                            <InfoTooltip title="⏳ Validity Period" text="How long the source license remains active after purchase. Perpetual means it never expires." />
                        </label>
                        <select
                            value={sourceValidityMode}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSourceValidityMode(val);
                                if (val !== "custom") {
                                    setSourceValidityDays(val);
                                } else {
                                    setSourceValidityDays(sourceValidityDays === "0" ? "90" : sourceValidityDays);
                                }
                                handleFormChange();
                            }}
                            className={inputClasses}
                        >
                            {VALIDITY_PRESETS.map(p => (
                                <option key={p.days} value={String(p.days)} className="text-gray-900 dark:text-gray-100 dark:bg-gray-900">{p.label}</option>
                            ))}
                            <option value="custom" className="text-gray-900 dark:text-gray-100 dark:bg-gray-900">Custom (enter days)</option>
                        </select>
                        {sourceValidityMode === "custom" && (
                            <div className="mt-3">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        min="1"
                                        max="3650"
                                        value={sourceValidityDays}
                                        onChange={(e) => { setSourceValidityDays(e.target.value); handleFormChange(); }}
                                        placeholder="e.g. 90"
                                        className={`${inputClasses} max-w-[140px]`}
                                    />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">days</span>
                                </div>
                                {parseInt(sourceValidityDays) > 0 && (
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formatDaysAsMonths(parseInt(sourceValidityDays))}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Hidden inputs for structured data */}
                <input type="hidden" name="licenseFeatures" value={JSON.stringify({ usage: usageFeaturesText.split('\n').map(f => f.trim()).filter(f => f), source: sourceFeaturesText.split('\n').map(f => f.trim()).filter(f => f) })} />
                <input type="hidden" name="usageLicenseValidityDays" value={usageValidityDays} />
                <input type="hidden" name="sourceLicenseValidityDays" value={sourceValidityDays} />

                <div className="sm:col-span-2">
                    <label htmlFor="maxLicenses" className={labelClasses}>
                        Maximum Licenses
                        <InfoTooltip title="🎟️ Maximum Licenses" text="Limit the number of licenses available for purchase to create scarcity. Leave blank for unlimited." />
                    </label>
                    <div className="mt-2">
                        <input
                            type="number"
                            name="maxLicenses"
                            id="maxLicenses"
                            defaultValue={initialData?.maxLicenses || ""}
                            placeholder="e.g. 100"
                            min="1"
                            className={inputClasses}
                        />
                    </div>
                    {state?.error?.maxLicenses && (
                        <p className="mt-1 text-sm text-red-600">{state.error.maxLicenses}</p>
                    )}
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="tags" className={`${labelClasses} mb-2`}>
                        Tech Stack / Tags (Max 10)
                        <InfoTooltip title="🏷️ Tech Stack & Tags" text="Add relevant technologies, frameworks, or features to help developers find your asset. Press Enter to add each tag." />
                    </label>
                    <TagInput
                        initialTags={initialData?.tags || []}
                        maxTags={10}
                    />
                </div>

                {/* Asset File Upload */}
                <div className="sm:col-span-2">
                    <label className={`${labelClasses} mb-2`}>
                        Asset File (ZIP)
                        <InfoTooltip title="📦 Asset File" text="Upload a ZIP file containing your source code, templates, or deployable package. Max 100MB. This file will be delivered to buyers after purchase." />
                    </label>
                    <div className={`rounded-xl border border-dashed ${assetFile || existingFilePath ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10' : 'border-gray-300 dark:border-white/20 bg-white/50 dark:bg-white/5'} p-6 text-center transition-colors`}>
                        {assetFile ? (
                            <div className="flex items-center justify-center gap-3">
                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{assetFile.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{(assetFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                </div>
                                <button type="button" onClick={() => setAssetFile(null)} className="ml-4 text-xs text-red-600 dark:text-red-400 hover:underline">Remove</button>
                            </div>
                        ) : existingFilePath ? (
                            <div className="flex items-center justify-center gap-3">
                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">File uploaded</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{existingFilePath.split('/').pop()}</p>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <svg className="mx-auto w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Drop your file here or click to browse</p>
                            </div>
                        )}
                        <input
                            type="file"
                            name="assetFile"
                            id="assetFile"
                            accept=".zip,.rar,.7z,.tar,.gz,.tar.gz"
                            className={`mt-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white dark:file:bg-white dark:file:text-gray-900 file:cursor-pointer hover:file:bg-gray-800 dark:hover:file:bg-gray-200 file:transition-colors ${assetFile || existingFilePath ? 'mt-3' : ''}`}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                                        alert(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
                                        e.target.value = '';
                                        return;
                                    }
                                    setAssetFile(file);
                                    handleFormChange();
                                }
                            }}
                        />
                        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">ZIP, RAR, 7Z, TAR, GZ — Max {MAX_FILE_SIZE_MB}MB</p>
                    </div>
                    {state?.error?.assetFile && (
                        <p className="mt-1 text-sm text-red-600">{state.error.assetFile}</p>
                    )}
                </div>

                {/* Unified Images */}
                <div className="sm:col-span-2">
                    <label className={`${labelClasses} mb-2`}>
                        Asset Images (Cover + Gallery)
                    </label>
                    <ImageGallery
                        initialImages={initialImages}
                        onErrorStateChange={setGalleryHasError}
                        onImagesChange={setImagesChanged}
                        maxFileSizeMB={MAX_IMAGE_SIZE_MB}
                    />
                </div>


                {/* URLs */}
                <div className="sm:col-span-1">
                    <label htmlFor="demoUrl" className={labelClasses}>
                        Demo URL
                    </label>
                    <div className="mt-2">
                        <input
                            type="url"
                            name="demoUrl"
                            id="demoUrl"
                            defaultValue={initialData?.demoUrl || ""}
                            placeholder="https://demo.example.com"
                            className={inputClasses}
                        />
                    </div>
                    {state?.error?.demoUrl && (
                        <p className="mt-1 text-sm text-red-600">{state.error.demoUrl}</p>
                    )}
                </div>

                <div className="sm:col-span-1">
                    <label htmlFor="githubUrl" className={labelClasses}>
                        GitHub URL
                    </label>
                    <div className="mt-2">
                        <input
                            type="url"
                            name="githubUrl"
                            id="githubUrl"
                            defaultValue={initialData?.githubUrl || ""}
                            placeholder="https://github.com/..."
                            className={inputClasses}
                        />
                    </div>
                    {state?.error?.githubUrl && (
                        <p className="mt-1 text-sm text-red-600">{state.error.githubUrl}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-end gap-4 border-t border-gray-200/60 dark:border-white/10 pt-8 mt-8">
                {isSaveDisabled && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No changes detected.</p>
                )}
                {submitAttempted && hasImageErrors && (
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">⚠️ Please fix image errors before submitting.</p>
                )}
                <button
                    type="submit"
                    disabled={hasImageErrors || isSaveDisabled || isPending}
                    className="inline-flex justify-center rounded-xl bg-gray-900 dark:bg-white px-10 py-4 text-base font-semibold text-white dark:text-gray-900 shadow-sm transition hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? (
                        <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white dark:text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {isEditing ? "Saving Changes..." : "Submitting..."}
                        </div>
                    ) : (
                        isEditing ? "Save Changes" : "Submit for Review"
                    )}
                </button>
            </div>
        </form>
    );
}
