import { createClient } from "@/utils/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Determines the correct public-facing origin for the current deployment.
 * Priority: x-forwarded-host → VERCEL_BRANCH_URL → VERCEL_URL → NEXT_PUBLIC_APP_URL
 */
function getOrigin(request: NextRequest): string {
    const forwardedHost = request.headers.get("x-forwarded-host");
    if (forwardedHost) {
        const protocol = forwardedHost.includes("localhost") ? "http" : "https";
        return `${protocol}://${forwardedHost}`;
    }
    if (process.env.VERCEL_BRANCH_URL) {
        return `https://${process.env.VERCEL_BRANCH_URL}`;
    }
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    return process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/onboarding";

    const origin = getOrigin(request);

    if (code) {
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
                    return NextResponse.redirect(`${origin}/admin`);
                }
            }

            return NextResponse.redirect(`${origin}${next}`);
        } else {
            console.error("[Auth Callback] exchangeCodeForSession error:", error.message);
        }
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
