import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { getUserLicenses } from "@codexchange/db/src/queries";

export const licenseRouter = createTRPCRouter({
    /**
     * Get user's licenses
     * TODO: Add auth check to ensure user can only see their own licenses
     */
    getUserLicenses: publicProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ input }) => {
            return await getUserLicenses(input.userId);
        }),

    /**
     * Generate download URL for a license
     * TODO: Implement S3 pre-signed URL generation
     */
    generateDownloadUrl: publicProcedure
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
