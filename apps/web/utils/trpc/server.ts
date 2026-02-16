import "server-only";

import { headers } from "next/headers";

import { createTRPCContext, createCallerFactory } from "../../server/api/trpc";
import { appRouter } from "../../server/api/root";

export const createCaller = createCallerFactory(appRouter);

export const api = async () => {
    const context = await createTRPCContext({
        req: {
            headers: await headers(),
        } as any, // Mocking Request
        resHeaders: new Headers(),
        info: {
            isBatchCall: false,
            calls: [],
            accept: "application/json",
            type: "query",
            connectionParams: null,
            signal: new AbortController().signal,
        } as any,
    });
    return createCaller(context);
};
