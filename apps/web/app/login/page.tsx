import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string }>;
}) {
    const params = await searchParams;
    const message = params?.message;

    const signIn = async (formData: FormData) => {
        "use server";

        const email = formData.get("email") as string;
        const supabase = await createClient();
        const headersList = await headers();

        let origin = process.env.NEXT_PUBLIC_APP_URL!;
        const host = headersList.get("x-forwarded-host") || headersList.get("host");
        if (host) {
            const protocol = host.includes("localhost") ? "http" : "https";
            origin = `${protocol}://${host}`;
        }

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true,
                emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
            },
        });

        if (error) {
            console.error("❌ Auth Error:", error.message);
            const errorMessage = error.message.toLowerCase().includes("rate limit")
                ? "Too many login attempts. Please wait a few minutes and try again."
                : error.message;
            return redirect(`/login?message=Could not authenticate user: ${errorMessage}`);
        }

        return redirect("/login?message=Check your email for magic link");
    };

    const signInWithPassword = async (formData: FormData) => {
        "use server";
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const supabase = await createClient();


        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("❌ Auth Error:", error.message);
            return redirect(`/login?message=Could not authenticate: ${error.message}`);
        }

        return redirect("/dashboard");
    };

    const signInWithGoogle = async () => {
        "use server";
        const supabase = await createClient();
        const headersList = await headers();

        let origin = process.env.NEXT_PUBLIC_APP_URL!;
        const host = headersList.get("x-forwarded-host") || headersList.get("host");
        if (host) {
            const protocol = host.includes("localhost") ? "http" : "https";
            origin = `${protocol}://${host}`;
        }

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${origin}/auth/callback?next=/onboarding`,
            },
        });

        if (error) {
            console.error("❌ Google Auth Error:", error.message);
            return redirect(`/login?message=Could not authenticate with Google: ${error.message}`);
        }

        if (data.url) {
            redirect(data.url);
        }
    };

    const signInWithGithub = async () => {
        "use server";
        const supabase = await createClient();
        const headersList = await headers();

        let origin = process.env.NEXT_PUBLIC_APP_URL!;
        const host = headersList.get("x-forwarded-host") || headersList.get("host");
        if (host) {
            const protocol = host.includes("localhost") ? "http" : "https";
            origin = `${protocol}://${host}`;
        }

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
                redirectTo: `${origin}/auth/callback?next=/onboarding`,
            },
        });

        if (error) {
            console.error("❌ GitHub Auth Error:", error.message);
            return redirect(`/login?message=Could not authenticate with GitHub: ${error.message}`);
        }

        if (data.url) {
            redirect(data.url);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px]" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-md space-y-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-8 rounded-2xl shadow-xl">
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Sign in to <span className="font-black uppercase tracking-tight">CODE<span className="text-indigo-600 dark:text-indigo-400">XCHANGE</span></span>
                    </h2>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                        Or{" "}
                        <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                            create a new account
                        </Link>
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    <div className="flex flex-col gap-4">
                        <form action={signInWithGoogle}>
                            <button
                                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-200"
                            >
                                <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                                    <path
                                        d="M12.0003 20.4101C16.6366 20.4101 20.5262 17.2559 21.9427 13.1362H12.0003V10.7422H24.3636C24.4759 11.4504 24.5366 12.1883 24.5366 12.9559C24.5366 19.8637 18.914 25.4667 12.0003 25.4667C5.08658 25.4667 -0.536011 19.8637 -0.536011 12.9734C-0.536011 6.08304 5.08658 0.480042 12.0003 0.480042C15.0877 0.480042 17.8863 1.51731 20.089 3.23849L17.7813 6.06915C16.5416 5.1764 14.7397 4.19504 12.0003 4.19504C7.45331 4.19504 3.70425 7.66986 3.70425 12.9734C3.70425 18.2769 7.45331 21.7517 12.0003 21.7517V20.4101Z"
                                        fill="currentColor"
                                    />
                                </svg>
                                Sign in with Google
                            </button>
                        </form>

                        <form action={signInWithGithub}>
                            <button
                                className="flex w-full items-center justify-center gap-3 rounded-xl border border-transparent bg-[#24292F] px-4 py-3 text-sm font-medium text-white shadow-md hover:bg-[#24292F]/90 focus:outline-none focus:ring-2 focus:ring-[#24292F] focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-200"
                            >
                                <svg className="h-5 w-5 bg-transparent fill-white relative -mt-0.5" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                Sign in with GitHub
                            </button>
                        </form>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white dark:bg-slate-900 px-3 py-0.5 rounded-full text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 text-xs font-medium tracking-wide shadow-sm">
                                    OR CONTINUE WITH
                                </span>
                            </div>
                        </div>

                        <form className="mt-4 space-y-5">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="email-address" className="sr-only">
                                        Email address
                                    </label>
                                    <input
                                        id="email-address"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="relative block w-full appearance-none rounded-xl border border-slate-300 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors"
                                        placeholder="Email address"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password" className="sr-only">
                                        Password
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        className="relative block w-full appearance-none rounded-xl border border-slate-300 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors"
                                        placeholder="Password (optional for Magic Link)"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    formAction={signInWithPassword}
                                    className="group relative flex w-full justify-center items-center rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-300"
                                >
                                    Sign in with Password
                                </button>

                                <button
                                    formAction={signIn}
                                    className="group relative flex w-full justify-center items-center rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-300"
                                >
                                    Sign in with Magic Link
                                </button>
                            </div>
                        </form>

                        {message && (
                            <div className={`mt-4 rounded-xl p-4 border ${message.includes("Could not") ? "bg-red-50/50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20 text-red-600 dark:text-red-400" : "bg-indigo-50/50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400"}`}>
                                <p className="text-center text-sm font-medium">
                                    {message}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
