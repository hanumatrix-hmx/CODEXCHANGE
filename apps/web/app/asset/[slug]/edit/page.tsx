import { db, categories, assets, listingImages, listingTags, tags } from "@codexchange/db";
import SubmitAssetForm from "../../submit/submit-form";
import MarketplaceLayout from "@/components/marketplace-layout";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";

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
            <div className="mx-auto max-w-4xl py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Edit Tool: {assetData.name}</h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Update your asset details, images, or pricing. Note: URLs cannot be changed after initial publication.
                    </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                    <SubmitAssetForm categories={allCategories} initialData={fullAssetData} />
                </div>
            </div>
        </MarketplaceLayout>
    );
}
