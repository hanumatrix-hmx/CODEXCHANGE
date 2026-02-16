"use server";

import { db, assets } from "@codexchange/db";
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
});

export async function submitAsset(formData: FormData) {
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
    };

    const validated = assetSchema.safeParse(rawData);

    if (!validated.success) {
        return {
            error: validated.error.flatten().fieldErrors,
        };
    }

    const { techStack, ...rest } = validated.data;

    try {
        await db.insert(assets).values({
            ...rest,
            builderId: user.id,
            techStack: techStack ? techStack.split(",").map(s => s.trim()) : [],
            status: "pending_review",
        });
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
