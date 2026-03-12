import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Storage utility for generating signed download URLs.
 * Uses the service role key to bypass RLS for storage operations.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Default bucket for asset files
const ASSET_BUCKET = "assets";

function getAdminClient() {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error(
            "Supabase Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
        );
    }
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
    });
}

/**
 * Generate a signed URL for downloading a file from Supabase Storage.
 *
 * @param storagePath - The path within the bucket (e.g. "builder-id/asset-slug/file.zip")
 * @param expiresInSeconds - How long the URL stays valid (default: 1 hour)
 * @param bucket - Supabase storage bucket name (default: "assets")
 * @returns Signed download URL
 */
export async function generateSignedDownloadUrl(
    storagePath: string,
    expiresInSeconds = 3600,
    bucket = ASSET_BUCKET
): Promise<{ url: string; expiresAt: Date }> {
    const supabase = getAdminClient();

    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, expiresInSeconds, {
            download: true,
        });

    if (error || !data?.signedUrl) {
        console.error("Supabase Storage signed URL error:", error);
        throw new Error(
            `Failed to generate download URL: ${error?.message ?? "Unknown error"}`
        );
    }

    return {
        url: data.signedUrl,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
}
