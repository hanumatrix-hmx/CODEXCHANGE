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
        <div className="flex min-h-screen flex-col items-center justify-center py-2">
            <div className="w-full max-w-md space-y-8 px-4 sm:px-0">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold tracking-tight">
                        Sign in to CODEXCHANGE
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Or{" "}
                        <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                            create a new account
                        </Link>
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    <div className="flex flex-col gap-4">
                        <form action={signInWithGoogle}>
                            <button
                                className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                                className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-[#24292F] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#24292F]/90 focus:outline-none focus:ring-2 focus:ring-[#24292F] focus:ring-offset-2"
                            >
                                <svg className="h-5 w-5 bg-transparent fill-white" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                Sign in with GitHub
                            </button>
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-gray-50 px-2 text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <form className="mt-8 space-y-6">
                            <div className="space-y-4 rounded-md shadow-sm">
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
                                        className="relative block w-full appearance-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
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
                                        className="relative block w-full appearance-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                        placeholder="Password (optional for Magic Link)"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <button
                                    formAction={signInWithPassword}
                                    className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    Sign in with Password
                                </button>

                                <div className="relative flex py-1 items-center">
                                    <div className="flex-grow border-t border-gray-200"></div>
                                    <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase tracking-wider">Or</span>
                                    <div className="flex-grow border-t border-gray-200"></div>
                                </div>

                                <button
                                    formAction={signIn}
                                    className="group relative flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    Sign in with Magic Link
                                </button>
                            </div>
                        </form>

                        {message && (
                            <div className={`rounded-md p-4 ${message.includes("Could not") ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
                                <p className="text-center text-sm">
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
