import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import {
    getAssetBySlug,
    getRelatedAssets,
    incrementAssetViews,
} from "@codexchange/db/src/queries";
import { cookies } from "next/headers";

export const assetRouter = createTRPCRouter({
    /**
     * Get asset by slug with all relations
     */
    getBySlug: publicProcedure
        .input(z.object({ slug: z.string() }))
        .query(async ({ input }) => {
            const asset = await getAssetBySlug(input.slug);

            if (!asset) {
                throw new Error("Asset not found");
            }

            return asset;
        }),

    /**
     * Get related assets by category
     */
    getRelated: publicProcedure
        .input(
            z.object({
                categoryId: z.string(),
                excludeAssetId: z.string(),
                limit: z.number().optional(),
            })
        )
        .query(async ({ input }) => {
            return await getRelatedAssets(
                input.categoryId,
                input.excludeAssetId,
                input.limit
            );
        }),

    /**
     * Increment view count for an asset uniquely per session
     */
    incrementViews: publicProcedure
        .input(z.object({ assetId: z.string() }))
        .mutation(async ({ input }) => {
            const cookieStore = await cookies();
            const cookieName = `viewed_asset_${input.assetId}`;

            // Check if the user has already viewed this asset in this session/timeframe
            if (cookieStore.has(cookieName)) {
                return { success: true, message: "Already viewed" };
            }

            // Increment the view count in the database
            await incrementAssetViews(input.assetId);

            // Set a cookie that expires in 24 hours to prevent duplicate views
            cookieStore.set(cookieName, "true", {
                maxAge: 60 * 60 * 24, // 24 hours
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
            });

            return { success: true, message: "View recorded" };
        }),
});
