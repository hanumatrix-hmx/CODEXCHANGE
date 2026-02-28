import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/onboarding";

    const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const isLocalEnv = process.env.NODE_ENV === "development";

    let redirectOrigin = origin;
    if (!isLocalEnv && forwardedHost) {
        redirectOrigin = `https://${forwardedHost}`;
    }

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Check if user is admin
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role, full_name")
                    .eq("id", user.id)
                    .single();

                // Redirect admin users directly to admin page ONLY if profile is complete
                if (profile?.role === "admin" && profile.full_name) {
                    return NextResponse.redirect(`${redirectOrigin}/admin`);
                }
            }

            return NextResponse.redirect(`${redirectOrigin}${next}`);
        }
    }

    return NextResponse.redirect(`${redirectOrigin}/auth/auth-code-error`);
}
