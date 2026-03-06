"use server";

import { db, assets, listingImages, tags, listingTags } from "@codexchange/db";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq, inArray, and, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const assetSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
    categoryId: z.string().uuid("Please select a valid category"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    longDescription: z.string().optional(),
    usageLicensePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
    sourceLicensePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format").optional().or(z.literal("")).transform(val => (val === "" || val === undefined) ? null : val),
    maxLicenses: z.string().optional().transform(val => val ? parseInt(val, 10) : null),
    demoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
    githubUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
    licenseFeatures: z.string().transform((str, ctx) => {
        try {
            return JSON.parse(str);
        } catch (e) {
            ctx.addIssue({ code: 'custom', message: 'Invalid JSON for license features' });
            return z.NEVER;
        }
    }).optional(),
});

export type FormState = {
    error?: {
        name?: string[];
        slug?: string[];
        categoryId?: string[];
        description?: string[];
        usageLicensePrice?: string[];
        sourceLicensePrice?: string[];
        maxLicenses?: string[];
        demoUrl?: string[];
        githubUrl?: string[];
        _form?: string[];
    };
    message?: string | null;
};

export async function submitAsset(_prevState: any, formData: FormData): Promise<FormState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("You must be logged in to submit an asset");
    }

    const rawData = {
        name: formData.get("name") as string,
        slug: formData.get("slug") as string,
        categoryId: formData.get("categoryId") as string,
        description: formData.get("description") as string,
        longDescription: formData.get("longDescription") as string,
        usageLicensePrice: formData.get("usageLicensePrice") as string,
        sourceLicensePrice: formData.get("sourceLicensePrice") as string,
        maxLicenses: formData.get("maxLicenses") as string,
        demoUrl: formData.get("demoUrl") as string,
        githubUrl: formData.get("githubUrl") as string,
        licenseFeatures: formData.get("licenseFeatures") as string,
    };

    const tagsStr = formData.get("tags") as string;
    let tagNames: string[] = [];
    if (tagsStr) {
        try {
            tagNames = JSON.parse(tagsStr);
        } catch (e) {
            console.error("Invalid tags format");
        }
    }

    const validated = assetSchema.safeParse(rawData);

    if (!validated.success) {
        return {
            error: validated.error.flatten().fieldErrors,
        };
    }

    const { ...rest } = validated.data;

    // Handle image uploads
    const coverImageFile = formData.get("coverImage") as File;
    const galleryImageFiles = formData.getAll("galleryImages") as File[];

    const validGalleryImages = galleryImageFiles.filter(file => file.size > 0 && file.type.startsWith("image/"));

    const uploadedImageUrls: { url: string, sortOrder: number }[] = [];

    try {
        // Upload Cover Image
        if (coverImageFile && coverImageFile.size > 0 && coverImageFile.type.startsWith("image/")) {
            const fileExt = coverImageFile.name.split(".").pop();
            const fileName = `${user.id}/${rest.slug}/cover-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("listing-images")
                .upload(fileName, coverImageFile);

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from("listing-images")
                    .getPublicUrl(fileName);

                // Cover image is always sortOrder 0
                uploadedImageUrls.push({ url: publicUrl, sortOrder: 0 });
            } else {
                console.error("Error uploading cover image! File:", fileName, "Error:", uploadError);
            }
        }

        // Upload Gallery Images
        for (let i = 0; i < validGalleryImages.length; i++) {
            const file = validGalleryImages[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${rest.slug}/gallery-${Date.now()}-${i}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("listing-images")
                .upload(fileName, file);

            if (uploadError) {
                console.error("Error uploading gallery image:", uploadError);
                console.error("Failed File:", fileName);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from("listing-images")
                .getPublicUrl(fileName);

            // Gallery images start from sortOrder 1
            uploadedImageUrls.push({ url: publicUrl, sortOrder: i + 1 });
        }

        const [newAsset] = await db.insert(assets).values({
            ...rest,
            builderId: user.id,
            status: "pending_review",
            // Use the cover image (sortOrder 0) as thumbnail if available, otherwise first gallery image
            thumbnailUrl: uploadedImageUrls.length > 0 ? uploadedImageUrls.sort((a, b) => a.sortOrder - b.sortOrder)[0].url : null,
        }).returning({ id: assets.id });

        if (uploadedImageUrls.length > 0) {
            await db.insert(listingImages).values(
                uploadedImageUrls.map(img => ({
                    assetId: newAsset.id,
                    url: img.url,
                    sortOrder: img.sortOrder,
                }))
            );
        }

        // Handle tags
        if (tagNames.length > 0) {
            const uniqueTagNames = [...new Set(tagNames.map(t => t.toLowerCase()))].slice(0, 10);
            const tagIdsToLink: string[] = [];

            for (const tagName of uniqueTagNames) {
                const [existingTag] = await db.select().from(tags).where(eq(tags.name, tagName));
                if (existingTag) {
                    tagIdsToLink.push(existingTag.id);
                } else {
                    const [newTag] = await db.insert(tags).values({ name: tagName }).returning({ id: tags.id });
                    tagIdsToLink.push(newTag.id);
                }
            }

            if (tagIdsToLink.length > 0) {
                await db.insert(listingTags).values(
                    tagIdsToLink.map(tagId => ({
                        assetId: newAsset.id,
                        tagId
                    }))
                );
            }
        }
    } catch (error: any) {
        console.error("Failed to submit asset - General Catch Block Error:", error);
        if (error.code === "23505") { // Unique violation
            return {
                error: { slug: ["Slug already exists. Please choose a different one."] },
            };
        }
        return {
            error: { _form: ["Failed to submit asset. Please try again."] },
        };
    }

    revalidatePath("/admin/assets");
    revalidatePath("/browse");

    return redirect("/dashboard/builder?message=Asset submitted successfully and is pending review.");
}

export async function updateAsset(_prevState: any, formData: FormData): Promise<FormState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("You must be logged in to update an asset");
    }

    const assetId = formData.get("assetId") as string;
    if (!assetId) {
        throw new Error("Asset ID is required.");
    }

    const [existingAsset] = await db.select().from(assets).where(eq(assets.id, assetId));
    if (!existingAsset || existingAsset.builderId !== user.id) {
        throw new Error("Unauthorized to edit this asset");
    }

    const rawData = {
        name: formData.get("name") as string,
        slug: existingAsset.slug, // Keep existing slug
        categoryId: formData.get("categoryId") as string,
        description: formData.get("description") as string,
        longDescription: formData.get("longDescription") as string,
        usageLicensePrice: formData.get("usageLicensePrice") as string,
        sourceLicensePrice: formData.get("sourceLicensePrice") as string,
        maxLicenses: formData.get("maxLicenses") as string,
        demoUrl: formData.get("demoUrl") as string,
        githubUrl: formData.get("githubUrl") as string,
        licenseFeatures: formData.get("licenseFeatures") as string,
    };

    const tagsStr = formData.get("tags") as string;
    let tagNames: string[] = [];
    if (tagsStr) {
        try {
            tagNames = JSON.parse(tagsStr);
        } catch (e) {
            console.error("Invalid tags format");
        }
    }

    const validated = assetSchema.safeParse(rawData);

    if (!validated.success) {
        return {
            error: validated.error.flatten().fieldErrors,
        };
    }

    const { slug, ...rest } = validated.data;

    const coverImageFile = formData.get("coverImage") as File | null;
    const galleryImageFiles = formData.getAll("galleryImages") as File[];
    const validGalleryImages = galleryImageFiles.filter(file => file.size > 0 && file.type.startsWith("image/"));

    // Handle removed images
    const removedGalleryImageUrlsStr = formData.get("removedGalleryImageUrls") as string;
    if (removedGalleryImageUrlsStr) {
        try {
            const removedUrls = JSON.parse(removedGalleryImageUrlsStr) as string[];
            if (removedUrls.length > 0) {
                await db.delete(listingImages).where(inArray(listingImages.url, removedUrls));

                // Optional: remove from storage
                const pathsToRemove = removedUrls.map(url => {
                    const match = url.split("/listing-images/")[1];
                    return match;
                }).filter(Boolean) as string[];

                if (pathsToRemove.length > 0) {
                    await supabase.storage.from("listing-images").remove(pathsToRemove);
                }
            }
        } catch (e) {
            console.error("Failed to parse removed gallery images", e);
        }
    }

    let updatedThumbnailUrl = existingAsset.thumbnailUrl;
    const uploadedImageUrls: { url: string, sortOrder: number }[] = [];

    try {
        if (coverImageFile && coverImageFile.size > 0 && coverImageFile.type.startsWith("image/")) {
            const fileExt = coverImageFile.name.split(".").pop();
            const fileName = `${user.id}/${existingAsset.slug}/cover-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("listing-images")
                .upload(fileName, coverImageFile);

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from("listing-images")
                    .getPublicUrl(fileName);

                uploadedImageUrls.push({ url: publicUrl, sortOrder: 0 });
                updatedThumbnailUrl = publicUrl;

                // Delete old cover image from DB
                const [oldCover] = await db.select().from(listingImages).where(
                    and(eq(listingImages.assetId, assetId), eq(listingImages.sortOrder, 0))
                );
                if (oldCover) {
                    await db.delete(listingImages).where(eq(listingImages.id, oldCover.id));
                    const match = oldCover.url.split("/listing-images/")[1];
                    if (match) {
                        await supabase.storage.from("listing-images").remove([match]);
                    }
                }
            }
        }

        // Upload Gallery Images
        // Find max current sortOrder
        let nextSortOrder = 1;
        const currentImages = await db.select().from(listingImages).where(eq(listingImages.assetId, assetId));
        if (currentImages.length > 0) {
            nextSortOrder = Math.max(...currentImages.map(i => i.sortOrder)) + 1;
        }

        for (let i = 0; i < validGalleryImages.length; i++) {
            const file = validGalleryImages[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${existingAsset.slug}/gallery-${Date.now()}-${i}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("listing-images")
                .upload(fileName, file);

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from("listing-images")
                    .getPublicUrl(fileName);

                uploadedImageUrls.push({ url: publicUrl, sortOrder: nextSortOrder + i });
            }
        }

        await db.update(assets).set({
            ...rest,
            thumbnailUrl: updatedThumbnailUrl,
            updatedAt: new Date(),
        }).where(eq(assets.id, assetId));

        if (uploadedImageUrls.length > 0) {
            await db.insert(listingImages).values(
                uploadedImageUrls.map(img => ({
                    assetId,
                    url: img.url,
                    sortOrder: img.sortOrder,
                }))
            );
        }

        // Handle tags
        if (tagNames.length > 0) {
            const uniqueTagNames = [...new Set(tagNames.map(t => t.toLowerCase()))].slice(0, 10);
            const tagIdsToLink: string[] = [];

            for (const tagName of uniqueTagNames) {
                const [existingTag] = await db.select().from(tags).where(eq(tags.name, tagName));
                if (existingTag) {
                    tagIdsToLink.push(existingTag.id);
                } else {
                    const [newTag] = await db.insert(tags).values({ name: tagName }).returning({ id: tags.id });
                    tagIdsToLink.push(newTag.id);
                }
            }

            await db.delete(listingTags).where(eq(listingTags.assetId, assetId));

            if (tagIdsToLink.length > 0) {
                await db.insert(listingTags).values(
                    tagIdsToLink.map(tagId => ({
                        assetId,
                        tagId
                    }))
                );
            }
        } else {
            await db.delete(listingTags).where(eq(listingTags.assetId, assetId));
        }
    } catch (error: any) {
        console.error("Failed to update asset:", error);
        return {
            error: { _form: ["Failed to update asset. Please try again."] },
        };
    }

    revalidatePath("/admin/assets");
    revalidatePath("/browse");
    revalidatePath(`/asset/${existingAsset.slug}`);

    return redirect("/dashboard/builder?message=Asset updated successfully.");
}

export async function searchTags(query: string) {
    if (!query || query.trim() === "") return [];

    try {
        const results = await db
            .select({ id: tags.id, name: tags.name })
            .from(tags)
            .where(ilike(tags.name, `%${query.trim()}%`))
            .limit(10);
        return results;
    } catch (e) {
        console.error("Failed to search tags", e);
        return [];
    }
}
