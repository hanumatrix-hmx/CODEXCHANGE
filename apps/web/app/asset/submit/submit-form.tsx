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

const MAX_FILE_SIZE_MB = 4;

export default function SubmitAssetForm({ categories, initialData }: { categories: any[], initialData?: any }) {
    const isEditing = !!initialData;
    const action = isEditing ? updateAsset : submitAsset;
    const [state, formAction] = useActionState(action, initialState);

    const [usageLicensePrice, setUsageLicensePrice] = useState<string>(initialData?.usageLicensePrice || "");
    const [sourceLicensePrice, setSourceLicensePrice] = useState<string>(initialData?.sourceLicensePrice || "");
    const [usageFeaturesText, setUsageFeaturesText] = useState<string>(initialData?.licenseFeatures?.usage?.join('\n') || "Deploy to production\nUnlimited end users\nTechnical support\nUpdates for 1 year");
    const [sourceFeaturesText, setSourceFeaturesText] = useState<string>(initialData?.licenseFeatures?.source?.join('\n') || "Full source code access\nModify and customize\nLifetime updates\nPriority support");

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
                            <option value="">Select a category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
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
                </div>

                {/* Hidden input to pass licenseFeatures as JSON string */}
                <input type="hidden" name="licenseFeatures" value={JSON.stringify({ usage: usageFeaturesText.split('\n').map(f => f.trim()).filter(f => f), source: sourceFeaturesText.split('\n').map(f => f.trim()).filter(f => f) })} />

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

                {/* Unified Images */}
                <div className="sm:col-span-2">
                    <label className={`${labelClasses} mb-2`}>
                        Asset Images (Cover + Gallery)
                    </label>
                    <ImageGallery
                        initialImages={initialImages}
                        onErrorStateChange={setGalleryHasError}
                        onImagesChange={setImagesChanged}
                        maxFileSizeMB={MAX_FILE_SIZE_MB}
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
                    disabled={hasImageErrors || isSaveDisabled}
                    className="inline-flex justify-center rounded-xl bg-gray-900 dark:bg-white px-10 py-4 text-base font-semibold text-white dark:text-gray-900 shadow-sm transition hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isEditing ? "Save Changes" : "Submit for Review"}
                </button>
            </div>
        </form>
    );
}
