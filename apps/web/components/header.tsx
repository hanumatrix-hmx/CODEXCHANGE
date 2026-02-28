"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { keepPreviousData } from "@tanstack/react-query";
import { LogOut, User } from "lucide-react";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/client";
import { api } from "@/utils/trpc/client";

export function Header() {
    const utils = api.useUtils();
    const pathname = usePathname();

    // Fetch user from database via tRPC
    // - placeholderData keeps previous user visible during background refetches (no blank flash)
    // - staleTime: 5 min avoids redundant calls; refetchOnWindowFocus keeps session fresh
    const { data: user, isLoading } = api.user.getCurrentUser.useQuery(undefined, {
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
    });

    // Effect 1: runs on every navigation (pathname change).
    // Calls getSession() to pick up server-side logins — when login happens via a
    // Server Action, the browser Supabase client never fires SIGNED_IN, so
    // onAuthStateChange alone won't help. Reading the cookie here catches it.
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                utils.user.getCurrentUser.setData(undefined, {
                    id: session.user.id,
                    email: session.user.email ?? "",
                    fullName: session.user.user_metadata?.full_name ?? null,
                    role: "buyer", // temporary — corrected by background invalidate
                });
                utils.user.getCurrentUser.invalidate();
            }
        });
    }, [pathname, utils]);

    // Effect 2: stable subscription for client-side auth events (SIGNED_IN / SIGNED_OUT).
    // Registered once — no need to re-subscribe on every navigation.
    useEffect(() => {
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
                utils.user.getCurrentUser.setData(undefined, {
                    id: session.user.id,
                    email: session.user.email ?? "",
                    fullName: session.user.user_metadata?.full_name ?? null,
                    role: "buyer",
                });
                utils.user.getCurrentUser.invalidate();
            } else if (event === "SIGNED_OUT") {
                utils.user.getCurrentUser.setData(undefined, null);
            }
        });
        return () => subscription.unsubscribe();
    }, [utils]);

    const handleLogout = async () => {
        const supabase = createClient();
        // Clear header immediately — don't wait for the network signOut call
        utils.user.getCurrentUser.setData(undefined, null);
        // Fire signOut without awaiting — session is cleared from local storage
        // synchronously by Supabase before the server request completes
        supabase.auth.signOut();
        window.location.href = "/login";
    };

    if (isLoading) {
        return (
            <header className="sticky top-0 z-50 border-b border-white/6 bg-slate-950/80 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/" className="text-xl font-extrabold tracking-tight text-white">
                            CODE<span className="text-indigo-400">XCHANGE</span>
                        </Link>
                        <div className="h-8 w-32 animate-pulse rounded-lg bg-white/8" />
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className="sticky top-0 z-50 border-b border-white/6 bg-slate-950/80 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="text-xl font-extrabold tracking-tight text-white">
                        CODE<span className="text-indigo-400">XCHANGE</span>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex items-center gap-6">
                        <Link
                            href="/browse"
                            className="text-sm font-medium text-slate-400 transition hover:text-white"
                        >
                            Browse
                        </Link>
                        <Link
                            href="/dashboard"
                            className="text-sm font-medium text-slate-400 transition hover:text-white"
                        >
                            Dashboard
                        </Link>
                        {user?.role === "admin" && (
                            <Link
                                href="/admin"
                                className="text-sm font-medium text-slate-400 transition hover:text-white"
                            >
                                Admin
                            </Link>
                        )}
                        {(user?.role === "builder" || user?.role === "admin") && (
                            <Link
                                href="/asset/submit"
                                className="text-sm font-medium text-slate-400 transition hover:text-white"
                            >
                                Sell Asset
                            </Link>
                        )}
                    </nav>

                    {/* User Menu */}
                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-slate-400" />
                                <span className="font-medium text-slate-300">
                                    {user.fullName || user.email?.split("@")[0]}
                                </span>
                                <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-300 ring-1 ring-inset ring-indigo-500/20">
                                    {user.role}
                                </span>
                            </div>
                            <Button
                                onClick={handleLogout}
                                variant="ghost"
                                size="sm"
                                className="gap-2 text-slate-400 hover:text-white"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link href="/login">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-400 hover:text-white"
                                >
                                    Login
                                </Button>
                            </Link>
                            <Link href="/signup">
                                <Button
                                    size="sm"
                                    className="bg-indigo-600 text-white hover:bg-indigo-500"
                                >
                                    Sign Up
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
