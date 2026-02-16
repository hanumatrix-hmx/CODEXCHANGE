import { initTRPC, TRPCError } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { db } from "@codexchange/db";
import { createClient } from "@/utils/supabase/server";

import superjson from "superjson";

export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
    // Get Supabase client and check authentication
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    let user: { id: string; role: "admin" | "builder" | "buyer" } | null = null;

    if (authUser) {
        // Fetch user profile from database using raw query to avoid Drizzle version conflicts
        const profiles = await db.query.profiles.findFirst({
            where: (profiles, { eq }) => eq(profiles.id, authUser.id),
        });

        if (profiles) {
            user = {
                id: profiles.id,
                role: profiles.role as "admin" | "builder" | "buyer",
            };
        }
    }

    return {
        db,
        headers: opts.req.headers,
        user,
    };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
    transformer: superjson,
});

// Middleware to check if user is admin
const isAdmin = t.middleware(async ({ ctx, next }) => {
    if (!ctx.user || ctx.user.role !== "admin") {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin access required",
        });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
});

// Middleware to check if user is authenticated
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Authentication required",
        });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthenticated);
export const adminProcedure = t.procedure.use(isAdmin);
export const createCallerFactory = t.createCallerFactory;
