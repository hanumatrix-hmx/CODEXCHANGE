"use client";

import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { submitAsset, type FormState } from "./actions";
import { useState } from "react";

const initialState: FormState = {
    error: {},
    message: null,
};

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="inline-flex justify-center rounded-lg bg-blue-600 px-10 py-4 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {pending ? "Submitting..." : "Submit for Review"}
        </button>
    );
}

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

export default function SubmitAssetForm({ categories }: { categories: any[] }) {
    const [state, formAction] = useActionState(submitAsset, initialState);
    const [selectedImages, setSelectedImages] = useState<number>(0);
    const [usageLicensePrice, setUsageLicensePrice] = useState<string>("");
    const [sourceLicensePrice, setSourceLicensePrice] = useState<string>("");
    const [usageFeatures, setUsageFeatures] = useState<string[]>(["Deploy to production", "Unlimited end users", "Technical support", "Updates for 1 year"]);
    const [sourceFeatures, setSourceFeatures] = useState<string[]>(["Full source code access", "Modify and customize", "White-label rights", "Lifetime updates", "Priority support"]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedImages(e.target.files.length);
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
        <form action={formAction} className="space-y-8">
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
                            placeholder="autogpt-pro"
                            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
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
                            placeholder="Detailed explanation, features, and setup instructions..."
                            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Pricing & Tech */}
                <div className="sm:col-span-1">
                    <label htmlFor="usageLicensePrice" className="block text-sm font-semibold text-gray-900">
                        Usage License Price (₹)
                    </label>
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
                                <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                                    <div className="flex justify-between"><span>Buyer Pays:</span> <span className="font-medium">₹{price.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-red-600"><span>Platform Fee (16%):</span> <span>-₹{earnings.platformFee.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-red-600"><span>GST on Fee (18%):</span> <span>-₹{earnings.gstOnFee.toFixed(2)}</span></div>
                                    <div className="flex justify-between font-semibold border-t border-gray-300 mt-1 pt-1 text-green-700"><span>You Get:</span> <span>₹{earnings.builderEarnings.toFixed(2)}</span></div>
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
                        <label className="block text-xs font-semibold text-gray-700 mb-2">Included Usage Features</label>
                        <div className="space-y-2">
                            {usageFeatures.map((feature, index) => (
                                <div key={`usage-${index}`} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={feature}
                                        onChange={(e) => updateFeature('usage', index, e.target.value)}
                                        className="block w-full rounded-md border-0 py-1.5 text-xs text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600"
                                        placeholder="Feature"
                                    />
                                    <button type="button" onClick={() => removeFeature('usage', index)} className="text-gray-400 hover:text-red-500">×</button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addFeature('usage')} className="text-xs text-blue-600 hover:underline">+ Add Feature</button>
                        </div>
                    </div>

                    {/* Source Features (Optional - conceptually linked to source license if we had a separate price input) */}
                    {/* For now, we only have one price input in this UI but the user asked for source features too.
                        I'll add a separate Source License Price input to match the schema/plan properly or just features.
                        The previous UI only had usageLicensePrice. I will add Source Price + Features to be complete.
                        Wait, the file content I read shows only usageLicensePrice. I should add Source License Price too as per plan.
                     */}
                </div>

                <div className="sm:col-span-1">
                    <label htmlFor="sourceLicensePrice" className="block text-sm font-semibold text-gray-900">
                        Source License Price (₹)
                    </label>
                    <div className="mt-2 relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <span className="text-gray-500">₹</span>
                        </div>
                        <input
                            type="text"
                            name="sourceLicensePrice" // This needs to be handled in action if not already
                            id="sourceLicensePrice"
                            placeholder="Optional"
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
                                <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                                    <div className="flex justify-between"><span>Buyer Pays:</span> <span className="font-medium">₹{price.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-red-600"><span>Platform Fee (16%):</span> <span>-₹{earnings.platformFee.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-red-600"><span>GST on Fee (18%):</span> <span>-₹{earnings.gstOnFee.toFixed(2)}</span></div>
                                    <div className="flex justify-between font-semibold border-t border-gray-300 mt-1 pt-1 text-green-700"><span>You Get:</span> <span>₹{earnings.builderEarnings.toFixed(2)}</span></div>
                                </div>
                            );
                        }
                        return <p className="mt-1 text-xs text-gray-500">Leave empty if source code is not for sale.</p>;
                    })()}

                    {/* Source Features */}
                    <div className="mt-4">
                        <label className="block text-xs font-semibold text-gray-700 mb-2">Included Source Features</label>
                        <div className="space-y-2">
                            {sourceFeatures.map((feature, index) => (
                                <div key={`source-${index}`} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={feature}
                                        onChange={(e) => updateFeature('source', index, e.target.value)}
                                        className="block w-full rounded-md border-0 py-1.5 text-xs text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600"
                                        placeholder="Feature"
                                    />
                                    <button type="button" onClick={() => removeFeature('source', index)} className="text-gray-400 hover:text-red-500">×</button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addFeature('source')} className="text-xs text-blue-600 hover:underline">+ Add Feature</button>
                        </div>
                    </div>
                </div>

                {/* Hidden input to pass licenseFeatures as JSON string */}
                <input type="hidden" name="licenseFeatures" value={JSON.stringify({ usage: usageFeatures.filter(f => f), source: sourceFeatures.filter(f => f) })} />

                <div className="sm:col-span-1">
                    <label htmlFor="techStack" className="block text-sm font-semibold text-gray-900">
                        Tech Stack (comma-separated)
                    </label>
                    <div className="mt-2">
                        <input
                            type="text"
                            name="techStack"
                            id="techStack"
                            placeholder="Next.js, Python, OpenAI"
                            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Images */}
                <div className="sm:col-span-2">
                    <label htmlFor="coverImage" className="block text-sm font-semibold text-gray-900">
                        Cover Image (Reference / Thumbnail)
                    </label>
                    <div className="mt-2">
                        <input
                            type="file"
                            name="coverImage"
                            id="coverImage"
                            accept="image/*"
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">This will be the main image displayed on cards and the top of the asset page.</p>
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="galleryImages" className="block text-sm font-semibold text-gray-900">
                        Gallery Images
                    </label>
                    <div className="mt-2">
                        <input
                            type="file"
                            name="galleryImages"
                            id="galleryImages"
                            multiple
                            accept="image/*"
                            onChange={handleImageChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Upload additional screenshots or promotional images.</p>
                    {selectedImages > 0 && (
                        <p className="mt-2 text-sm text-green-600">
                            {selectedImages} gallery file(s) selected
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
                            placeholder="https://github.com/..."
                            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    {state?.error?.githubUrl && (
                        <p className="mt-1 text-sm text-red-600">{state.error.githubUrl}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-end border-t border-gray-200 pt-8">
                <SubmitButton />
            </div>
        </form>
    );
}
