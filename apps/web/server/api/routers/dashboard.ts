import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getBuilderAnalytics, getBuyerStats } from "@codexchange/db/src/queries";

export const dashboardRouter = createTRPCRouter({
    /**
     * Get builder statistics and analytics.
     * Auth: Only the authenticated builder can view their own stats.
     */
    getBuilderStats: protectedProcedure
        .input(z.object({ builderId: z.string() }))
        .query(async ({ input, ctx }) => {
            if (ctx.user.id !== input.builderId) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You can only view your own builder stats",
                });
            }
            return await getBuilderAnalytics(input.builderId);
        }),

    /**
     * Get buyer statistics.
     * Auth: Only the authenticated buyer can view their own stats.
     */
    getBuyerStats: protectedProcedure
        .input(z.object({ buyerId: z.string() }))
        .query(async ({ input, ctx }) => {
            if (ctx.user.id !== input.buyerId) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You can only view your own buyer stats",
                });
            }
            return await getBuyerStats(input.buyerId);
        }),
});
