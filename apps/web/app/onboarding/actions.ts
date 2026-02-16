"use server";

import { db, profiles } from "@codexchange/db";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function setRole(data: {
    role: "buyer" | "builder";
    fullName: string;
    bio?: string;
    companyName?: string;
    website?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User not authenticated");
    }

    try {
        // Check if user already has a profile with admin role
        const existingProfile = await db.query.profiles.findFirst({
            where: (profiles, { eq }) => eq(profiles.id, user.id),
        });

        // If user is already an admin, don't change their role
        if (existingProfile?.role === "admin") {
            console.log("User is already an admin, skipping role change");
            return redirect("/admin");
        }

        // Update profile with role and details
        await db.insert(profiles).values({
            id: user.id,
            email: user.email!,
            role: data.role,
            fullName: data.fullName,
            bio: data.bio,
            companyName: data.companyName,
            website: data.website,
        }).onConflictDoUpdate({
            target: profiles.id,
            set: {
                role: data.role,
                fullName: data.fullName,
                bio: data.bio,
                companyName: data.companyName,
                website: data.website,
                updatedAt: new Date()
            }
        });

        // Update Supabase user metadata for caching/middleware
        await supabase.auth.updateUser({
            data: {
                role: data.role,
                full_name: data.fullName,
            }
        });

        revalidatePath("/dashboard");
        revalidatePath("/onboarding");
    } catch (error) {
        console.error("Failed to set role:", error);
        throw new Error("An error occurred while setting your role.");
    }

    return redirect("/dashboard");
}
