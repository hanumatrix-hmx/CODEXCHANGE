import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "../trpc";
import { getPendingAssets } from "@codexchange/db/src/queries";
import { assets, auditLogs } from "@codexchange/db";
import { eq } from "drizzle-orm";

export const adminRouter = createTRPCRouter({
    /**
     * Get pending asset submissions
     * Admin-only access
     */
    getPendingSubmissions: adminProcedure.query(async () => {
        return await getPendingAssets();
    }),

    /**
     * Approve an asset submission
     * Admin-only access
     */
    approveAsset: adminProcedure
        .input(
            z.object({
                assetId: z.string(),
                qualityTier: z.enum(["bronze", "silver", "gold"]),
                usageLicensePrice: z.number().optional(),
                sourceLicensePrice: z.number().optional(),
                adminId: z.string(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            // Prepare update data
            const updateData: any = {
                status: "approved",
                qualityTier: input.qualityTier,
                updatedAt: new Date(),
            };

            if (input.usageLicensePrice !== undefined) {
                updateData.usageLicensePrice = input.usageLicensePrice.toString();
            }

            if (input.sourceLicensePrice !== undefined) {
                updateData.sourceLicensePrice = input.sourceLicensePrice.toString();
            }

            // Update asset
            await ctx.db
                .update(assets)
                .set(updateData)
                .where(eq(assets.id, input.assetId));

            // Log admin action
            await ctx.db.insert(auditLogs).values({
                userId: input.adminId,
                action: "asset_approved",
                entityType: "asset",
                entityId: input.assetId,
                metadata: {
                    qualityTier: input.qualityTier,
                    prices: {
                        usage: input.usageLicensePrice,
                        source: input.sourceLicensePrice,
                    },
                },
            });

            return { success: true };
        }),

    /**
     * Reject an asset submission
     * Admin-only access
     */
    rejectAsset: adminProcedure
        .input(
            z.object({
                assetId: z.string(),
                reason: z.string(),
                adminId: z.string(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            // Update asset
            await ctx.db
                .update(assets)
                .set({
                    status: "rejected",
                    updatedAt: new Date(),
                } as any)
                .where(eq(assets.id, input.assetId));

            // Log admin action
            await ctx.db.insert(auditLogs).values({
                userId: input.adminId,
                action: "asset_rejected",
                entityType: "asset",
                entityId: input.assetId,
                metadata: {
                    reason: input.reason,
                },
            });

            return { success: true };
        }),

    /**
     * Get recent audit logs
     * Admin-only access
     */
    getAuditLog: adminProcedure
        .input(z.object({ limit: z.number().default(50) }))
        .query(async ({ input, ctx }) => {
            return await ctx.db.query.auditLogs.findMany({
                limit: input.limit,
                orderBy: (logs, { desc }) => [desc(logs.createdAt)],
                with: {
                    user: true,
                },
            });
        }),
});
