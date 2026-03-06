"use client";

import { useActionState } from "react";
import { submitAsset, updateAsset, type FormState } from "./actions";
import { useState, useEffect } from "react";
import Image from "next/image";
import TagInput from "./tag-input";

const initialState: FormState = {
    error: {},
    message: null,
};

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
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function SubmitAssetForm({ categories, initialData }: { categories: any[], initialData?: any }) {
    const isEditing = !!initialData;
    const action = isEditing ? updateAsset : submitAsset;
    const [state, formAction] = useActionState(action, initialState);

    const [selectedImages, setSelectedImages] = useState<number>(0);
    const [usageLicensePrice, setUsageLicensePrice] = useState<string>(initialData?.usageLicensePrice || "");
    const [sourceLicensePrice, setSourceLicensePrice] = useState<string>(initialData?.sourceLicensePrice || "");
    const [usageFeatures, setUsageFeatures] = useState<string[]>(initialData?.licenseFeatures?.usage || ["Deploy to production", "Unlimited end users", "Technical support", "Updates for 1 year"]);
    const [sourceFeatures, setSourceFeatures] = useState<string[]>(initialData?.licenseFeatures?.source || ["Full source code access", "Modify and customize", "Lifetime updates", "Priority support"]);
    const [coverImageError, setCoverImageError] = useState<string | null>(null);
    const [galleryImageError, setGalleryImageError] = useState<string | null>(null);
    const [coverImageSelected, setCoverImageSelected] = useState<boolean>(false);
    const [submitAttempted, setSubmitAttempted] = useState<boolean>(false);
    const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
    const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([]);

    const [removedGalleryImageUrls, setRemovedGalleryImageUrls] = useState<string[]>([]);

    const originalGalleryImages = initialData?.listingImages?.filter((img: any) => img.sortOrder > 0) || [];
    const remainingGalleryImages = originalGalleryImages.filter((img: any) => !removedGalleryImageUrls.includes(img.url));
    const totalGalleryImages = remainingGalleryImages.length + selectedImages;

    const coverMissing = !isEditing && !coverImageSelected;
    const galleryInsufficient = totalGalleryImages < 2;
    const hasImageErrors = !!coverImageError || !!galleryImageError || coverMissing || galleryInsufficient;

    useEffect(() => {
        return () => {
            if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
            galleryPreviewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [coverPreviewUrl, galleryPreviewUrls]);

    const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCoverImageError(null);
        if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
        setCoverPreviewUrl(null);

        const file = e.target.files?.[0];
        if (file) {
            setCoverImageSelected(true);
            setCoverPreviewUrl(URL.createObjectURL(file));
            if (file.size > MAX_FILE_SIZE_BYTES) {
                setCoverImageError(`Cover image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`);
            }
        } else {
            setCoverImageSelected(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setGalleryImageError(null);
        galleryPreviewUrls.forEach(url => URL.revokeObjectURL(url));
        setGalleryPreviewUrls([]);

        if (e.target.files) {
            const files = Array.from(e.target.files);
            const urls = files.map(file => URL.createObjectURL(file));
            setGalleryPreviewUrls(urls);

            const oversized = files.filter(f => f.size > MAX_FILE_SIZE_BYTES);
            if (oversized.length > 0) {
                setGalleryImageError(
                    `${oversized.length} file(s) exceed the ${MAX_FILE_SIZE_MB} MB limit: ${oversized.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)`).join(", ")}. Please remove them and re-select.`
                );
            }
            setSelectedImages(files.length);
        } else {
            setSelectedImages(0);
        }
    };

    const addFeature = (type: 'usage' | 'source') => {
        if (type === 'usage') setUsageFeatures([...usageFeatures, ""]);
        else setSourceFeatures([...sourceFeatures, ""]);
    };

    const updateFeature = (type: 'usage' | 'source', index: number, value: string) => {
        if (type === 'usage') {
            const newFeatures = [...usageFeatures];
            newFeatures[index] = value;
            setUsageFeatures(newFeatures);
        } else {
            const newFeatures = [...sourceFeatures];
            newFeatures[index] = value;
            setSourceFeatures(newFeatures);
        }
    };

    const removeFeature = (type: 'usage' | 'source', index: number) => {
        if (type === 'usage') {
            const newFeatures = usageFeatures.filter((_, i) => i !== index);
            setUsageFeatures(newFeatures);
        } else {
            const newFeatures = sourceFeatures.filter((_, i) => i !== index);
            setSourceFeatures(newFeatures);
        }
    };

    return (
        <form action={formAction} className="space-y-8" onSubmit={(e) => { setSubmitAttempted(true); if (hasImageErrors) e.preventDefault(); }}>
            {state?.error?._form && (
                <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                {state.error._form}
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            {isEditing && <input type="hidden" name="assetId" value={initialData.id} />}
            {isEditing && <input type="hidden" name="removedGalleryImageUrls" value={JSON.stringify(removedGalleryImageUrls)} />}

            <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                {/* Basic Info */}
                <div className="sm:col-span-2">
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-900">
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
                            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    {state?.error?.name && (
                        <p className="mt-1 text-sm text-red-600">{state.error.name}</p>
                    )}
                </div>

                <div className="sm:col-span-1">
                    <label htmlFor="slug" className="block text-sm font-semibold text-gray-900">
                        URL Slug
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
                            className={`block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 ${isEditing ? "bg-gray-100 cursor-not-allowed opacity-75" : ""}`}
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Only lowercase letters, numbers, and hyphens.</p>
                    {state?.error?.slug && (
                        <p className="mt-1 text-sm text-red-600">{state.error.slug}</p>
                    )}
                </div>

                <div className="sm:col-span-1">
                    <label htmlFor="categoryId" className="block text-sm font-semibold text-gray-900">
                        Category
                    </label>
                    <div className="mt-2">
                        <select
                            id="categoryId"
                            name="categoryId"
                            required
                            defaultValue={initialData?.categoryId || ""}
                            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
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
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-900">
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
                            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    {state?.error?.description && (
                        <p className="mt-1 text-sm text-red-600">{state.error.description}</p>
                    )}
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="longDescription" className="block text-sm font-semibold text-gray-900">
                        Long Description (Markdown)
                    </label>
                    <div className="mt-2">
                        <textarea
                            id="longDescription"
                            name="longDescription"
                            rows={6}
                            defaultValue={initialData?.longDescription || ""}
                            placeholder="Detailed explanation, features, and setup instructions..."
                            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Pricing & Tech */}
                <div className="sm:col-span-1">
                    <div className="flex items-center gap-2">
                        <label htmlFor="usageLicensePrice" className="block text-sm font-semibold text-gray-900">
                            Usage License Price (₹)
                        </label>
                        <div className="relative group">
                            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold cursor-default select-none">i</span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg bg-gray-800 text-white text-xs p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                <p className="font-semibold mb-1">🔒 Usage License</p>
                                <p>Buyer can use your tool as-is. They get access to deploy and run it, technical support, and updates — but <strong>no access to the source code</strong>. They cannot modify, resell, or redistribute it.</p>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-2 relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <span className="text-gray-500">₹</span>
                        </div>
                        <input
                            type="text"
                            name="usageLicensePrice"
                            id="usageLicensePrice"
                            required
                            placeholder="0.00"
                            value={usageLicensePrice}
                            onChange={(e) => setUsageLicensePrice(e.target.value)}
                            className="block w-full rounded-lg border border-gray-300 pl-8 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    {(() => {
                        const price = parseFloat(usageLicensePrice);
                        const earnings = calculateEarnings(price);
                        if (earnings) {
                            return (
                                <div className="mt-2 text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <div className="flex justify-between py-0.5"><span>Buyer Pays:</span> <span className="font-medium">₹{price.toFixed(2)}</span></div>
                                    <div className="flex justify-between py-0.5 text-red-600"><span>Platform Fee (16%):</span> <span>−₹{earnings.platformFee.toFixed(2)}</span></div>
                                    <div className="flex justify-between py-0.5 text-red-600"><span>GST on Fee (18%):</span> <span>−₹{earnings.gstOnFee.toFixed(2)}</span></div>
                                    <div className="flex justify-between font-bold border-t border-blue-200 mt-2 pt-2 text-green-700 text-base"><span>You Get:</span> <span>₹{earnings.builderEarnings.toFixed(2)}</span></div>
                                </div>
                            );
                        }
                        return <p className="mt-1 text-xs text-gray-500">Use 0 for free assets.</p>;
                    })()}
                    {state?.error?.usageLicensePrice && (
                        <p className="mt-1 text-sm text-red-600">{state.error.usageLicensePrice}</p>
                    )}

                    {/* Usage Features */}
                    <div className="mt-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Included Usage Features</label>
                        <div className="space-y-2">
                            {usageFeatures.map((feature, index) => (
                                <div key={`usage-${index}`} className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={feature}
                                        onChange={(e) => updateFeature('usage', index, e.target.value)}
                                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        placeholder="e.g. Deploy to production"
                                    />
                                    <button type="button" onClick={() => removeFeature('usage', index)} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-red-500 transition-colors text-base font-bold">×</button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addFeature('usage')} className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">+ Add Feature</button>
                        </div>
                    </div>
                </div>

                <div className="sm:col-span-1">
                    <div className="flex items-center gap-2">
                        <label htmlFor="sourceLicensePrice" className="block text-sm font-semibold text-gray-900">
                            Source License Price (₹)
                        </label>
                        <div className="relative group">
                            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold cursor-default select-none">i</span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg bg-gray-800 text-white text-xs p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                <p className="font-semibold mb-1">📦 Source License</p>
                                <p>Buyer gets the <strong>full source code</strong> and the right to modify and customize it. Leave blank if you don&apos;t want to sell source access.</p>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-2 relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <span className="text-gray-500">₹</span>
                        </div>
                        <input
                            type="text"
                            name="sourceLicensePrice"
                            id="sourceLicensePrice"
                            placeholder="0.00"
                            value={sourceLicensePrice}
                            onChange={(e) => setSourceLicensePrice(e.target.value)}
                            className="block w-full rounded-lg border border-gray-300 pl-8 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    {(() => {
                        const price = parseFloat(sourceLicensePrice);
                        const earnings = calculateEarnings(price);
                        if (earnings) {
                            return (
                                <div className="mt-2 text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <div className="flex justify-between py-0.5"><span>Buyer Pays:</span> <span className="font-medium">₹{price.toFixed(2)}</span></div>
                                    <div className="flex justify-between py-0.5 text-red-600"><span>Platform Fee (16%):</span> <span>−₹{earnings.platformFee.toFixed(2)}</span></div>
                                    <div className="flex justify-between py-0.5 text-red-600"><span>GST on Fee (18%):</span> <span>−₹{earnings.gstOnFee.toFixed(2)}</span></div>
                                    <div className="flex justify-between font-bold border-t border-blue-200 mt-2 pt-2 text-green-700 text-base"><span>You Get:</span> <span>₹{earnings.builderEarnings.toFixed(2)}</span></div>
                                </div>
                            );
                        }
                        return <p className="mt-1 text-xs text-gray-500">Leave empty if source code is not for sale.</p>;
                    })()}

                    {/* Source Features */}
                    <div className="mt-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Included Source Features</label>
                        <div className="space-y-2">
                            {sourceFeatures.map((feature, index) => (
                                <div key={`source-${index}`} className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={feature}
                                        onChange={(e) => updateFeature('source', index, e.target.value)}
                                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        placeholder="e.g. Full source code access"
                                    />
                                    <button type="button" onClick={() => removeFeature('source', index)} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-red-500 transition-colors text-base font-bold">×</button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addFeature('source')} className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">+ Add Feature</button>
                        </div>
                    </div>
                </div>

                {/* Hidden input to pass licenseFeatures as JSON string */}
                <input type="hidden" name="licenseFeatures" value={JSON.stringify({ usage: usageFeatures.filter(f => f), source: sourceFeatures.filter(f => f) })} />

                <div className="sm:col-span-1">
                    <label htmlFor="maxLicenses" className="block text-sm font-semibold text-gray-900">
                        Maximum Licenses (Optional)
                    </label>
                    <div className="mt-2">
                        <input
                            type="number"
                            name="maxLicenses"
                            id="maxLicenses"
                            defaultValue={initialData?.maxLicenses || ""}
                            placeholder="e.g. 100"
                            min="1"
                            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Limit the number of licenses available for purchase to create scarcity.</p>
                    {state?.error?.maxLicenses && (
                        <p className="mt-1 text-sm text-red-600">{state.error.maxLicenses}</p>
                    )}
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="tags" className="block text-sm font-semibold text-gray-900 mb-2">
                        Tech Stack / Tags (Max 10)
                    </label>
                    <TagInput
                        initialTags={initialData?.tags || []}
                        maxTags={10}
                    />
                    <p className="mt-1 text-xs text-gray-500">Press ENTER to add a technology or feature tag. Search applies to existing tags.</p>
                </div>

                {/* Images */}
                <div className="sm:col-span-2">
                    <label htmlFor="coverImage" className="block text-sm font-semibold text-gray-900">
                        Cover Image (Reference / Thumbnail)
                    </label>
                    {isEditing && initialData.thumbnailUrl && !coverPreviewUrl && (
                        <div className="mt-2 mb-4">
                            <p className="text-sm text-gray-500 mb-2">Current Cover Image:</p>
                            <Image src={initialData.thumbnailUrl} alt="Cover" width={192} height={128} unoptimized className="h-32 w-48 object-cover rounded-lg border border-gray-200" />
                            <p className="text-xs text-gray-500 mt-2">Upload a new image below to replace the current cover.</p>
                        </div>
                    )}
                    {coverPreviewUrl && (
                        <div className="mt-2 mb-4">
                            <p className="text-sm text-gray-500 mb-2">New Cover Selection:</p>
                            <Image src={coverPreviewUrl} alt="Cover Preview" width={192} height={128} unoptimized className="h-32 w-48 object-cover rounded-lg border border-gray-200 ring-2 ring-blue-500" />
                            <p className="text-xs text-blue-600 mt-2">This image will replace the current cover upon saving.</p>
                        </div>
                    )}
                    <div className="mt-2 flex items-center">
                        <label htmlFor="coverImage" className="cursor-pointer inline-flex items-center justify-center rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
                            {isEditing && !!initialData.thumbnailUrl ? "Replace Cover Image" : "Choose File"}
                            <input
                                type="file"
                                name="coverImage"
                                id="coverImage"
                                accept="image/*"
                                onChange={handleCoverImageChange}
                                className="hidden"
                            />
                        </label>
                        <span className="ml-4 text-sm text-gray-500">
                            {coverPreviewUrl ? "New file selected" : "No file chosen"}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Required. Main image shown on cards and the asset page. Max {MAX_FILE_SIZE_MB} MB.</p>
                    {coverImageError && (
                        <p className="mt-1 text-sm text-red-600">⚠️ {coverImageError}</p>
                    )}
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="galleryImages" className="block text-sm font-semibold text-gray-900">
                        Gallery Images
                    </label>
                    {isEditing && originalGalleryImages.length > 0 && (
                        <div className="mt-2 mb-4">
                            <p className="text-sm text-gray-500 mb-2">Current Gallery Images:</p>
                            <div className="flex flex-wrap gap-4">
                                {originalGalleryImages.map((img: any) => {
                                    if (removedGalleryImageUrls.includes(img.url)) return null;
                                    return (
                                        <div key={img.id} className="relative group">
                                            <Image src={img.url} alt="Gallery" width={144} height={96} unoptimized className="h-24 w-36 object-cover rounded-lg border border-gray-200" />
                                            <button
                                                type="button"
                                                onClick={() => setRemovedGalleryImageUrls([...removedGalleryImageUrls, img.url])}
                                                className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 bg-white text-red-600 font-bold rounded-full border border-gray-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                                                title="Remove image"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {galleryPreviewUrls.length > 0 && (
                        <div className="mt-2 mb-4">
                            <p className="text-sm text-gray-500 mb-2">New Gallery Additions:</p>
                            <div className="flex flex-wrap gap-4">
                                {galleryPreviewUrls.map((url, i) => (
                                    <div key={`preview-${i}`} className="relative">
                                        <Image src={url} alt={`Preview ${i + 1}`} width={144} height={96} unoptimized className="h-24 w-36 object-cover rounded-lg border border-gray-200 ring-2 ring-blue-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="mt-2 flex items-center">
                        <label htmlFor="galleryImages" className="cursor-pointer inline-flex items-center justify-center rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
                            {isEditing && originalGalleryImages.length > 0 ? "Add More Images" : "Choose Files"}
                            <input
                                type="file"
                                name="galleryImages"
                                id="galleryImages"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </label>
                        <span className="ml-4 text-sm text-gray-500">
                            {galleryPreviewUrls.length > 0 ? `${galleryPreviewUrls.length} file(s) selected` : "No files chosen"}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Required — at least 2 screenshots or promotional images total. Max {MAX_FILE_SIZE_MB} MB each.</p>
                    {galleryImageError && (
                        <p className="mt-1 text-sm text-red-600">⚠️ {galleryImageError}</p>
                    )}
                    {(totalGalleryImages > 0 || selectedImages > 0) && !galleryImageError && (
                        <p className={`mt-2 text-sm font-medium ${totalGalleryImages >= 2 ? 'text-green-600' : 'text-amber-600'}`}>
                            {totalGalleryImages} image{totalGalleryImages !== 1 ? 's' : ''} present/selected{totalGalleryImages < 2 ? ` — please add at least ${2 - totalGalleryImages} more` : ' ✓'}
                        </p>
                    )}
                </div>


                {/* URLs */}
                <div className="sm:col-span-1">
                    <label htmlFor="demoUrl" className="block text-sm font-semibold text-gray-900">
                        Demo URL
                    </label>
                    <div className="mt-2">
                        <input
                            type="url"
                            name="demoUrl"
                            id="demoUrl"
                            defaultValue={initialData?.demoUrl || ""}
                            placeholder="https://demo.example.com"
                            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    {state?.error?.demoUrl && (
                        <p className="mt-1 text-sm text-red-600">{state.error.demoUrl}</p>
                    )}
                </div>

                <div className="sm:col-span-1">
                    <label htmlFor="githubUrl" className="block text-sm font-semibold text-gray-900">
                        GitHub URL
                    </label>
                    <div className="mt-2">
                        <input
                            type="url"
                            name="githubUrl"
                            id="githubUrl"
                            defaultValue={initialData?.githubUrl || ""}
                            placeholder="https://github.com/..."
                            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    {state?.error?.githubUrl && (
                        <p className="mt-1 text-sm text-red-600">{state.error.githubUrl}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-end gap-4 border-t border-gray-200 pt-8">
                {submitAttempted && hasImageErrors && (
                    <p className="text-sm text-red-600">⚠️ Please fix image errors before submitting.</p>
                )}
                <button
                    type="submit"
                    disabled={hasImageErrors}
                    className="inline-flex justify-center rounded-lg bg-blue-600 px-10 py-4 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isEditing ? "Save Changes" : "Submit for Review"}
                </button>
            </div>
        </form>
    );
}
