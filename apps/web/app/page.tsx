import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function HomePage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <main className="min-h-screen p-8">
            <div className="mx-auto max-w-4xl">
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-4xl font-bold">CODEXCHANGE</h1>
                    <div>
                        {user ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-600">{user.email}</span>
                                <Link
                                    href="/dashboard"
                                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                                >
                                    Go to Dashboard
                                </Link>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
                            >
                                Log In / Sign Up
                            </Link>
                        )}
                    </div>
                </div>

                <p className="mb-6 text-lg">
                    B2B Marketplace for AI Tools - Development Mode
                </p>

                <div className="space-y-4">
                    <div className="rounded border p-4">
                        <h2 className="mb-2 text-xl font-semibold">✅ Setup Status</h2>
                        <ul className="list-inside list-disc space-y-1">
                            <li>Next.js 15 - Running</li>
                            <li>TypeScript - Configured</li>
                            <li>Database - Connected</li>
                            <li>Auth - {user ? "Authenticated" : "Ready"}</li>
                        </ul>
                    </div>

                    <div className="rounded border p-4">
                        <h2 className="mb-2 text-xl font-semibold">📋 Next Steps</h2>
                        <ol className="list-inside list-decimal space-y-1">
                            <li>Configure Supabase database connection (Done)</li>
                            <li>Run database migrations (Done)</li>
                            <li>Setup authentication (In Progress)</li>
                            <li>Test asset creation flow (Next)</li>
                        </ol>
                    </div>
                </div>
            </div>
        </main>
    );
}
