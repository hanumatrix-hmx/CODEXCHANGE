"use client";

import Link from "next/link";
import { useEffect } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { LogOut, User } from "lucide-react";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/client";
import { api } from "@/utils/trpc/client";

export function Header() {
    const utils = api.useUtils();


    // Fetch user from database via tRPC
    // - placeholderData keeps previous user visible during background refetches (no blank flash)
    // - staleTime: 5 min avoids redundant calls; refetchOnWindowFocus keeps session fresh
    const { data: user, isLoading } = api.user.getCurrentUser.useQuery(undefined, {
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
    });

    // Invalidate user query only when Supabase auth state actually changes (login, logout, token refresh)
    useEffect(() => {
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            utils.user.getCurrentUser.invalidate();
        });
        return () => subscription.unsubscribe();
    }, [utils]);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();

        // Invalidate all queries to clear cache
        await utils.invalidate();

        // Force a hard navigation to clear all state
        window.location.href = "/login";
    };

    if (isLoading) {
        return (
            <header className="border-b border-gray-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/" className="text-xl font-bold text-gray-900">
                            CODEXCHANGE
                        </Link>
                        <div className="h-8 w-32 animate-pulse bg-gray-200 rounded"></div>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="text-xl font-bold text-gray-900">
                        CODEXCHANGE
                    </Link>

                    {/* Navigation */}
                    <nav className="flex items-center gap-6">
                        <Link
                            href="/browse"
                            className="text-sm font-medium text-gray-700 hover:text-gray-900"
                        >
                            Browse
                        </Link>
                        <Link
                            href="/dashboard"
                            className="text-sm font-medium text-gray-700 hover:text-gray-900"
                        >
                            Dashboard
                        </Link>
                        {user?.role === "admin" && (
                            <Link
                                href="/admin"
                                className="text-sm font-medium text-gray-700 hover:text-gray-900"
                            >
                                Admin
                            </Link>
                        )}
                        {(user?.role === "builder" || user?.role === "admin") && (
                            <Link
                                href="/asset/submit"
                                className="text-sm font-medium text-gray-700 hover:text-gray-900"
                            >
                                Sell Asset
                            </Link>
                        )}
                    </nav>

                    {/* User Menu */}
                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="font-medium text-gray-700">
                                    {user.fullName || user.email?.split("@")[0]}
                                </span>
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                    {user.role}
                                </span>
                            </div>
                            <Button
                                onClick={handleLogout}
                                variant="ghost"
                                size="sm"
                                className="gap-2"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link href="/login">
                                <Button variant="ghost" size="sm">
                                    Login
                                </Button>
                            </Link>
                            <Link href="/signup">
                                <Button size="sm">
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
