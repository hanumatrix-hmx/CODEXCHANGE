import { createTRPCRouter, publicProcedure } from "./trpc";
import { z } from "zod";
import { categoryRouter } from "./routers/category";
import { assetRouter } from "./routers/asset";
import { licenseRouter } from "./routers/license";
import { dashboardRouter } from "./routers/dashboard";
import { adminRouter } from "./routers/admin";
import { paymentRouter } from "./routers/payment";
import { userRouter } from "./routers/user";

export const appRouter = createTRPCRouter({
    // Legacy hello endpoint
    hello: publicProcedure
        .input(z.object({ text: z.string() }))
        .query(({ input }) => {
            return {
                greeting: `Hello ${input.text}`,
            };
        }),

    // Feature routers
    category: categoryRouter,
    asset: assetRouter,
    license: licenseRouter,
    dashboard: dashboardRouter,
    admin: adminRouter,
    payment: paymentRouter,
    user: userRouter,
});

export type AppRouter = typeof appRouter;

