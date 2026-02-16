import { db, categories } from "@codexchange/db";
import { submitAsset } from "./actions";
import MarketplaceLayout from "@/components/marketplace-layout";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function SubmitAssetPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login?message=You must be logged in to submit an asset.");
    }

    const allCategories = await db.select().from(categories);

    return (
        <MarketplaceLayout>
            <div className="mx-auto max-w-4xl py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Submit New AI Tool</h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Share your creation with the world and start earning revenue from your AI assets.
                    </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                    <form action={submitAsset} className="space-y-8">
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
                                        {allCategories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
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
                                    Price (₹ INR)
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
                                        className="block w-full rounded-lg border border-gray-300 pl-8 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Use 0 for free assets.</p>
                            </div>

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
                            </div>
                        </div>

                        <div className="flex items-center justify-end border-t border-gray-200 pt-8">
                            <button
                                type="submit"
                                className="inline-flex justify-center rounded-lg bg-blue-600 px-10 py-4 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Submit for Review
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
