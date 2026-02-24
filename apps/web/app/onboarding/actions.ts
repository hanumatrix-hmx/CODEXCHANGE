"use server";

import { db, profiles } from "@codexchange/db";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function setRole(data: {
    role: "buyer" | "builder";
    fullName: string;
    bio?: string;
    storeName?: string;
    storeSlug?: string;
    gstin?: string;
    pan?: string;
    bankAccountId?: string;
    password?: string;
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

        // Determine final role - preserve admin if already set
        const finalRole = existingProfile?.role === "admin" ? "admin" : data.role;

        // Update profile with role and details
        await db.insert(profiles).values({
            id: user.id,
            email: user.email!,
            role: finalRole,
            fullName: data.fullName,
            bio: data.bio,
        }).onConflictDoUpdate({
            target: profiles.id,
            set: {
                role: finalRole,
                fullName: data.fullName,
                bio: data.bio,
                updatedAt: new Date()
            }
        });

        // Special handling for builders
        if (finalRole === "builder") {
            if (!data.storeName || !data.storeSlug || !data.gstin || !data.pan || !data.bankAccountId) {
                throw new Error("Missing mandatory builder compliance fields");
            }

            const { builderProfiles } = await import("@codexchange/db");

            await db.insert(builderProfiles).values({
                id: user.id,
                storeName: data.storeName,
                storeSlug: data.storeSlug,
                gstin: data.gstin,
                pan: data.pan,
                bankAccountId: data.bankAccountId,
            }).onConflictDoUpdate({
                target: builderProfiles.id,
                set: {
                    storeName: data.storeName,
                    storeSlug: data.storeSlug,
                    gstin: data.gstin,
                    pan: data.pan,
                    bankAccountId: data.bankAccountId,
                    updatedAt: new Date()
                }
            });
        }

        // Update Supabase user metadata for caching/middleware
        const updateData: { data: { role: "buyer" | "builder" | "admin"; full_name: string }; password?: string } = {
            data: {
                role: finalRole,
                full_name: data.fullName,
            }
        };

        if (data.password) {
            updateData.password = data.password;
        }

        await supabase.auth.updateUser(updateData);

        revalidatePath("/dashboard");
        revalidatePath("/onboarding");

        return redirect(finalRole === "admin" ? "/admin" : "/dashboard");
    } catch (error) {
        if ((error as any)?.digest?.startsWith("NEXT_REDIRECT")) throw error;
        console.error("Failed to set role:", error);
        throw new Error("An error occurred while setting your role.");
    }
}
