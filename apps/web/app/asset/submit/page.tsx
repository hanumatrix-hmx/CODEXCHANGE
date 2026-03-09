import { db, categories } from "@codexchange/db";
import SubmitAssetForm from "./submit-form";
import MarketplaceLayout from "@/components/marketplace-layout";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { BackButton } from "./back-button";

export default async function SubmitAssetPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login?message=You must be logged in to submit an asset.");
    }

    const allCategories = await db.select().from(categories).orderBy(categories.name);

    return (
        <MarketplaceLayout>
            <div className="mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <BackButton />
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">Submit New Tool</h1>
                    <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl">
                        Share your creation with the world and start earning revenue from your AI assets. Fill out the details below to get started.
                    </p>
                </div>

                <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-gray-900/50 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-900/5 dark:ring-white/10">
                    <SubmitAssetForm categories={allCategories} />
                </div>
            </div>
        </MarketplaceLayout>
    );
}
