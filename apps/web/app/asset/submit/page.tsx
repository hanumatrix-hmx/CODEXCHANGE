import { db, categories } from "@codexchange/db";
import SubmitAssetForm from "./submit-form";
import MarketplaceLayout from "@/components/marketplace-layout";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function SubmitAssetPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login?message=You must be logged in to submit an asset.");
    }

    const allCategories = await db.select().from(categories).orderBy(categories.name);

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
                    <SubmitAssetForm categories={allCategories} />
                </div>
            </div>
        </MarketplaceLayout>
    );
}
