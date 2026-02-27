import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getUserLicenses } from "@codexchange/db/src/queries";

export const licenseRouter = createTRPCRouter({
    /**
     * Get user's licenses.
     * Auth: Only the authenticated user can view their own licenses.
     */
    getUserLicenses: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ input, ctx }) => {
            if (ctx.user.id !== input.userId) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You can only view your own licenses",
                });
            }
            return await getUserLicenses(input.userId);
        }),

    /**
     * Generate download URL for a license.
     * Auth: User must be authenticated to generate a download URL.
     * Note: Full license ownership check will be added with S3 implementation.
     */
    generateDownloadUrl: protectedProcedure
        .input(z.object({ licenseId: z.string() }))
        .mutation(async () => {
            // Placeholder for S3 integration
            return {
                url: "#",
                expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
                message: "S3 integration pending",
            };
        }),
});
