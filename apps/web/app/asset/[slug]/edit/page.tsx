import { db, categories, assets, listingImages, listingTags, tags } from "@codexchange/db";
import SubmitAssetForm from "../../submit/submit-form";
import MarketplaceLayout from "@/components/marketplace-layout";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
import { BackButton } from "../../submit/back-button";

export default async function EditAssetPage({ params }: { params: any }) {
    const resolvedParams = await Promise.resolve(params);
    const slug = resolvedParams.slug;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login?message=You must be logged in to edit an asset.");
    }

    const [assetData] = await db.select().from(assets).where(eq(assets.slug, slug));

    if (!assetData) {
        notFound();
    }

    if (assetData.builderId !== user.id) {
        redirect("/dashboard/builder?error=Unauthorized");
    }

    const images = await db.select().from(listingImages).where(eq(listingImages.assetId, assetData.id));

    const tagsQuery = await db
        .select({ id: tags.id, name: tags.name })
        .from(listingTags)
        .innerJoin(tags, eq(listingTags.tagId, tags.id))
        .where(eq(listingTags.assetId, assetData.id));

    const fullAssetData = {
        ...assetData,
        listingImages: images,
        tags: tagsQuery
    };

    const allCategories = await db.select().from(categories).orderBy(categories.name);

    return (
        <MarketplaceLayout>
            <div className="mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <BackButton />
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">Edit Tool: {assetData.name}</h1>
                    <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl">
                        Update your asset details, images, or pricing. Note: URLs cannot be changed after initial publication.
                    </p>
                </div>

                <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-gray-900/50 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-900/5 dark:ring-white/10">
                    <SubmitAssetForm categories={allCategories} initialData={fullAssetData} />
                </div>
            </div>
        </MarketplaceLayout>
    );
}
