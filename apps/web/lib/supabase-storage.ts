import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Storage utility for asset file uploads and signed downloads.
 * Uses the service role key to bypass RLS for all storage operations.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Private bucket for downloadable asset files (ZIP packages, source code, etc.)
const ASSET_FILES_BUCKET = "asset-files";

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
 * Upload a file to the asset-files bucket.
 *
 * @param file      - The File/Blob to upload
 * @param storagePath - Destination path inside the bucket (e.g. "builder-id/slug/asset-123.zip")
 * @returns The storage path that was written (use this for DB records)
 */
export async function uploadAssetFile(
    file: File | Blob,
    storagePath: string
): Promise<string> {
    const supabase = getAdminClient();

    const { error } = await supabase.storage
        .from(ASSET_FILES_BUCKET)
        .upload(storagePath, file, {
            upsert: true, // overwrite if same path exists
            cacheControl: "3600",
        });

    if (error) {
        console.error("Supabase Storage upload error:", error);
        throw new Error(`Failed to upload file: ${error.message}`);
    }

    return storagePath;
}

/**
 * Delete a file from the asset-files bucket.
 *
 * @param storagePath - The path within the bucket to delete
 */
export async function deleteAssetFile(storagePath: string): Promise<void> {
    const supabase = getAdminClient();

    const { error } = await supabase.storage
        .from(ASSET_FILES_BUCKET)
        .remove([storagePath]);

    if (error) {
        console.error("Supabase Storage delete error:", error);
        // Non-fatal — log but don't throw so we don't block asset updates
    }
}

/**
 * Generate a signed URL for downloading a file from Supabase Storage.
 *
 * @param storagePath - The path within the bucket (e.g. "builder-id/asset-slug/file.zip")
 * @param expiresInSeconds - How long the URL stays valid (default: 1 hour)
 * @param bucket - Supabase storage bucket name (default: "asset-files")
 * @returns Signed download URL
 */
export async function generateSignedDownloadUrl(
    storagePath: string,
    expiresInSeconds = 3600,
    bucket = ASSET_FILES_BUCKET
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

