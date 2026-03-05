import { createClient } from "@/utils/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Determines the correct public-facing origin for the current deployment.
 *
 * Priority order:
 * 1. x-forwarded-host  — the actual hostname the user typed (most accurate)
 * 2. VERCEL_BRANCH_URL — Vercel-injected per-branch URL (runtime, not baked)
 * 3. VERCEL_URL        — Vercel-injected per-deployment URL (runtime, not baked)
 * 4. NEXT_PUBLIC_APP_URL — fallback env var (works locally / as last resort)
 *
 * VERCEL_BRANCH_URL and VERCEL_URL are NOT NEXT_PUBLIC_ so they are resolved
 * at runtime on the server — they correctly differ per deployment/branch.
 */
function getOrigin(request: NextRequest): string {
    console.log("[Auth] Raw headers:", {
        forwardedHost: request.headers.get("x-forwarded-host"),
        host: request.headers.get("host"),
        branchUrl: process.env.VERCEL_BRANCH_URL,
        vercelUrl: process.env.VERCEL_URL,
        nextPublicUrl: process.env.NEXT_PUBLIC_APP_URL,
    });

    // 1. x-forwarded-host (most accurate — real user-facing host)
    let forwardedHost = request.headers.get("x-forwarded-host");
    if (forwardedHost) {
        // Vercel sometimes sends comma-separated hosts. Take the first.
        forwardedHost = forwardedHost.split(",")[0].trim();
        // Remove port if present (e.g., :443)
        forwardedHost = forwardedHost.split(":")[0];

        const protocol = forwardedHost.includes("localhost") ? "http" : "https";
        const origin = `${protocol}://${forwardedHost}`;
        console.log("[Auth] Resolved origin from x-forwarded-host:", origin);
        return origin;
    }

    // 2. Vercel branch URL (stable per branch, runtime env)
    if (process.env.VERCEL_BRANCH_URL) {
        const origin = `https://${process.env.VERCEL_BRANCH_URL}`;
        console.log("[Auth] Resolved origin from VERCEL_BRANCH_URL:", origin);
        return origin;
    }

    // 3. Vercel deployment URL (unique per deployment, runtime env)
    if (process.env.VERCEL_URL) {
        const origin = `https://${process.env.VERCEL_URL}`;
        console.log("[Auth] Resolved origin from VERCEL_URL:", origin);
        return origin;
    }

    // 4. Fallback — env var or request origin
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    console.log("[Auth] Resolved origin from fallback:", origin);
    return origin;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    const { provider } = await params;

    if (provider !== "google" && provider !== "github") {
        return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }

    const origin = getOrigin(request);
    const redirectTo = `${origin}/auth/callback?next=/onboarding`;

    console.log(`[OAuth] Initiating ${provider} login with redirectTo:`, redirectTo);

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as "google" | "github",
        options: {
            redirectTo,
            queryParams: {
                // For Google: request offline access so refresh tokens are issued
                ...(provider === "google" && { access_type: "offline", prompt: "consent" }),
            },
        },
    });

    if (error || !data.url) {
        console.error(`[OAuth] ${provider} error from Supabase:`, error?.message);
        console.error(`[OAuth] ${provider} error:`, error?.message);
        const loginPath = request.headers.get("referer")?.includes("signup")
            ? "/signup"
            : "/login";
        return NextResponse.redirect(
            new URL(`${loginPath}?message=OAuth error: ${error?.message ?? "unknown"}`, origin)
        );
    }

    // NextResponse.redirect properly issues an HTTP 302 to data.url (an external URL).
    // The Supabase server client has already set the PKCE code-verifier cookie on
    // the response via the cookies() API — this is why Route Handlers work but
    // Server Actions don't: the cookie is flushed correctly here.
    return NextResponse.redirect(data.url);
}
