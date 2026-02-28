import { createTRPCRouter, publicProcedure } from "../trpc";
import { getAllCategoriesWithCount } from "@codexchange/db/src/queries";

export const categoryRouter = createTRPCRouter({
    /**
     * Get all categories with approved asset counts
     */
    getAll: publicProcedure.query(async () => {
        return await getAllCategoriesWithCount();
    }),
});
