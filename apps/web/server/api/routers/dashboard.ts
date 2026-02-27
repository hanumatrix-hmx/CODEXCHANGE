import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { getBuilderAnalytics, getBuyerStats } from "@codexchange/db/src/queries";

export const dashboardRouter = createTRPCRouter({
    /**
     * Get builder statistics and analytics
     */
    getBuilderStats: publicProcedure
        .input(z.object({ builderId: z.string() }))
        .query(async ({ input }) => {
            return await getBuilderAnalytics(input.builderId);
        }),

    /**
     * Get buyer statistics
     */
    getBuyerStats: publicProcedure
        .input(z.object({ buyerId: z.string() }))
        .query(async ({ input }) => {
            return await getBuyerStats(input.buyerId);
        }),
});
