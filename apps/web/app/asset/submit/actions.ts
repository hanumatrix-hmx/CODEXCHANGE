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
    const newImageFiles = formData.getAll("newImages") as File[];
    const validNewImages = newImageFiles.filter(file => file.size > 0 && file.type.startsWith("image/"));

    const imageOrderStr = formData.get("imageOrder") as string;
    let imageOrder: { type: 'existing' | 'new', url?: string, fileIndex?: number }[] = [];
    if (imageOrderStr) {
        try {
            imageOrder = JSON.parse(imageOrderStr);
        } catch (e) {
            console.error("Invalid image order format");
        }
    }

    const uploadedImageUrls: { url: string, sortOrder: number }[] = [];

    try {
        // Upload images based on order
        for (let i = 0; i < imageOrder.length; i++) {
            const item = imageOrder[i];

            if (item.type === 'new' && item.fileIndex !== undefined && item.fileIndex < validNewImages.length) {
                const file = validNewImages[item.fileIndex];
                const fileExt = file.name.split(".").pop();
                const prefix = i === 0 ? "cover" : "gallery";
                const fileName = `${user.id}/${rest.slug}/${prefix}-${Date.now()}-${i}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from("listing-images")
                    .upload(fileName, file);

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from("listing-images")
                        .getPublicUrl(fileName);

                    uploadedImageUrls.push({ url: publicUrl, sortOrder: i });
                } else {
                    console.error("Error uploading image:", uploadError);
                }
            } else if (item.type === 'existing' && item.url) {
                uploadedImageUrls.push({ url: item.url, sortOrder: i });
            }
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

    const newImageFiles = formData.getAll("newImages") as File[];
    const validNewImages = newImageFiles.filter(file => file.size > 0 && file.type.startsWith("image/"));

    const imageOrderStr = formData.get("imageOrder") as string;
    let imageOrder: { type: 'existing' | 'new', url?: string, fileIndex?: number }[] = [];
    if (imageOrderStr) {
        try {
            imageOrder = JSON.parse(imageOrderStr);
        } catch (e) {
            console.error("Invalid image order format");
        }
    }

    let updatedThumbnailUrl = existingAsset.thumbnailUrl;
    const newImagesToInsert: { url: string, sortOrder: number }[] = [];

    try {
        const existingUrlsToKeep = imageOrder.filter(i => i.type === 'existing' && i.url).map(i => i.url as string);

        // Find DB records to delete
        const currentImages = await db.select().from(listingImages).where(eq(listingImages.assetId, assetId));
        const urlsToDelete = currentImages.map(img => img.url).filter(url => !existingUrlsToKeep.includes(url));

        if (urlsToDelete.length > 0) {
            await db.delete(listingImages).where(inArray(listingImages.url, urlsToDelete));
            const pathsToRemove = urlsToDelete.map(url => url.split("/listing-images/")[1]).filter(Boolean) as string[];
            if (pathsToRemove.length > 0) {
                await supabase.storage.from("listing-images").remove(pathsToRemove);
            }
        }

        // Upload new images and update existing order
        for (let i = 0; i < imageOrder.length; i++) {
            const item = imageOrder[i];

            if (item.type === 'new' && item.fileIndex !== undefined && item.fileIndex < validNewImages.length) {
                const file = validNewImages[item.fileIndex];
                const fileExt = file.name.split(".").pop();
                const prefix = i === 0 ? "cover" : "gallery";
                const fileName = `${user.id}/${existingAsset.slug}/${prefix}-${Date.now()}-${i}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from("listing-images")
                    .upload(fileName, file);

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from("listing-images")
                        .getPublicUrl(fileName);

                    newImagesToInsert.push({ url: publicUrl, sortOrder: i });
                    if (i === 0) updatedThumbnailUrl = publicUrl;
                } else {
                    console.error("Error uploading image:", uploadError);
                }
            } else if (item.type === 'existing' && item.url) {
                await db.update(listingImages)
                    .set({ sortOrder: i })
                    .where(and(eq(listingImages.assetId, assetId), eq(listingImages.url, item.url)));

                if (i === 0) updatedThumbnailUrl = item.url;
            }
        }

        await db.update(assets).set({
            ...rest,
            thumbnailUrl: updatedThumbnailUrl,
            updatedAt: new Date(),
        }).where(eq(assets.id, assetId));

        if (newImagesToInsert.length > 0) {
            await db.insert(listingImages).values(
                newImagesToInsert.map(img => ({
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
