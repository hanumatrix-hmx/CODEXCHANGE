"use server";

import { db, assets, listingImages } from "@codexchange/db";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const assetSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
    categoryId: z.string().uuid("Please select a valid category"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    longDescription: z.string().optional(),
    usageLicensePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
    techStack: z.string().optional(),
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
        techStack: formData.get("techStack") as string,
        demoUrl: formData.get("demoUrl") as string,
        githubUrl: formData.get("githubUrl") as string,
        licenseFeatures: formData.get("licenseFeatures") as string,
    };

    const validated = assetSchema.safeParse(rawData);

    if (!validated.success) {
        return {
            error: validated.error.flatten().fieldErrors,
        };
    }

    const { techStack, ...rest } = validated.data;

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
                .from("listing-image")
                .upload(fileName, coverImageFile);

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from("listing-image")
                    .getPublicUrl(fileName);

                // Cover image is always sortOrder 0
                uploadedImageUrls.push({ url: publicUrl, sortOrder: 0 });
            } else {
                console.error("Error uploading cover image:", uploadError);
            }
        }

        // Upload Gallery Images
        for (let i = 0; i < validGalleryImages.length; i++) {
            const file = validGalleryImages[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${rest.slug}/gallery-${Date.now()}-${i}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("listing-image")
                .upload(fileName, file);

            if (uploadError) {
                console.error("Error uploading gallery image:", uploadError);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from("listing-image")
                .getPublicUrl(fileName);

            // Gallery images start from sortOrder 1
            uploadedImageUrls.push({ url: publicUrl, sortOrder: i + 1 });
        }

        const [newAsset] = await db.insert(assets).values({
            ...rest,
            builderId: user.id,
            techStack: techStack ? techStack.split(",").map(s => s.trim()) : [],
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
    } catch (error: any) {
        console.error("Failed to submit asset:", error);
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

    return redirect("/dashboard?message=Asset submitted successfully and is pending review.");
}
