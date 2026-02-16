import { createTRPCReact, type CreateTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../server/api/root";

export const trpc: CreateTRPCReact<AppRouter, unknown> = createTRPCReact<AppRouter>();

// Export as 'api' for convenience
export const api: CreateTRPCReact<AppRouter, unknown> = trpc;
