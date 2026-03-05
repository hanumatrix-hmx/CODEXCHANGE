import { createClient } from "@/utils/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Determines the correct public-facing origin for the current deployment.
 * Priority: x-forwarded-host → VERCEL_BRANCH_URL → VERCEL_URL → NEXT_PUBLIC_APP_URL
 */
function getOrigin(request: NextRequest): string {
    console.log("[Callback Auth] Raw headers:", {
        forwardedHost: request.headers.get("x-forwarded-host"),
        host: request.headers.get("host"),
        branchUrl: process.env.VERCEL_BRANCH_URL,
        vercelUrl: process.env.VERCEL_URL,
        nextPublicUrl: process.env.NEXT_PUBLIC_APP_URL,
    });

    let forwardedHost = request.headers.get("x-forwarded-host");
    if (forwardedHost) {
        forwardedHost = forwardedHost.split(",")[0].trim();
        forwardedHost = forwardedHost.split(":")[0];
        const protocol = forwardedHost.includes("localhost") ? "http" : "https";
        const origin = `${protocol}://${forwardedHost}`;
        console.log("[Callback] Resolved origin from x-forwarded-host:", origin);
        return origin;
    }
    if (process.env.VERCEL_BRANCH_URL) {
        const origin = `https://${process.env.VERCEL_BRANCH_URL}`;
        console.log("[Callback] Resolved origin from VERCEL_BRANCH_URL:", origin);
        return origin;
    }
    if (process.env.VERCEL_URL) {
        const origin = `https://${process.env.VERCEL_URL}`;
        console.log("[Callback] Resolved origin from VERCEL_URL:", origin);
        return origin;
    }
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    console.log("[Callback] Resolved origin from fallback:", origin);
    return origin;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/onboarding";

    const origin = getOrigin(request);

    if (code) {
        console.log(`[Callback] Exchanging code... next=${next}, origin=${origin}`);
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role, full_name")
                    .eq("id", user.id)
                    .single();

                // Redirect complete admin profiles directly to admin page
                if (profile?.role === "admin" && profile.full_name) {
                    console.log(`[Callback] Redirecting admin to ${origin}/admin`);
                    return NextResponse.redirect(`${origin}/admin`);
                }
            }

            console.log(`[Callback] Redirecting user to ${origin}${next}`);
            return NextResponse.redirect(`${origin}${next}`);
        } else {
            console.error("[Auth Callback] exchangeCodeForSession error:", error.message);
        }
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
