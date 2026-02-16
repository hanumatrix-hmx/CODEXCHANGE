import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import {
    getAssetBySlug,
    getRelatedAssets,
    incrementAssetViews,
} from "@codexchange/db/src/queries";

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
     * Increment view count for an asset
     */
    incrementViews: publicProcedure
        .input(z.object({ assetId: z.string() }))
        .mutation(async ({ input }) => {
            await incrementAssetViews(input.assetId);
            return { success: true };
        }),
});
