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

    // Keep redirect() OUTSIDE the try/catch — Next.js redirect() throws a special
    // internal exception (NEXT_REDIRECT) which must never be caught and swallowed.
    let finalRole: "buyer" | "builder" | "admin" = data.role;

    try {
        // Check if user already has a profile with admin role
        const existingProfile = await db.query.profiles.findFirst({
            where: (profiles, { eq }) => eq(profiles.id, user.id),
        });

        // Preserve admin role if already set
        finalRole = existingProfile?.role === "admin" ? "admin" : data.role;

        // Upsert profile
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
                updatedAt: new Date(),
            }
        });

        // Builder-specific upsert
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
                    updatedAt: new Date(),
                }
            });
        }

        // Update Supabase user metadata (role + name for middleware caching)
        await supabase.auth.updateUser({
            data: {
                role: finalRole,
                full_name: data.fullName,
            }
        });

        // Only update password if one was explicitly provided.
        // OAuth users (Google/GitHub) don't go through this form with a password,
        // and calling updateUser({ password: undefined }) can error on some Supabase versions.
        if (data.password && data.password.trim().length >= 6) {
            const { error: pwError } = await supabase.auth.updateUser({ password: data.password });
            if (pwError) {
                // Non-fatal: log but don't block onboarding completion
                console.warn("[setRole] Password update failed (non-fatal):", pwError.message);
            }
        }

        revalidatePath("/dashboard");
        revalidatePath("/onboarding");

    } catch (error) {
        console.error("[setRole] Failed:", error);
        // Re-throw the actual error message so developers can see what went wrong.
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Onboarding failed: ${message}`);
    }

    // redirect() must be OUTSIDE try/catch — it throws NEXT_REDIRECT internally.
    return redirect(finalRole === "admin" ? "/admin" : "/dashboard");
}
