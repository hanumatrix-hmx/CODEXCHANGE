import { createTRPCRouter, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
    /**
     * Get current authenticated user with role from database
     */
    getCurrentUser: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.user) {
            return null;
        }

        // Fetch full profile from database
        const profile = await ctx.db.query.profiles.findFirst({
            where: (profiles, { eq }) => eq(profiles.id, ctx.user!.id),
        });

        if (!profile) {
            return null;
        }

        return {
            id: profile.id,
            email: profile.email,
            fullName: profile.fullName,
            role: profile.role as "admin" | "builder" | "buyer",
        };
    }),
});
