"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { keepPreviousData } from "@tanstack/react-query";
import {
    Search,
    Menu,
    X,
    ChevronDown,
    User,
    LayoutDashboard,
    ShoppingBag,
    Settings,
    LogOut,
} from "lucide-react";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/client";
import { api } from "@/utils/trpc/client";
import { MegaMenu } from "./mega-menu";
import { cn } from "@/utils/cn";

export function Header() {
    const utils = api.useUtils();
    const pathname = usePathname();

    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);

    // Search state
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // User Dropdown state
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Queries
    const { data: user, isLoading } = api.user.getCurrentUser.useQuery(undefined, {
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
    });

    const { data: categories } = api.category.getAll.useQuery(undefined, {
        staleTime: 10 * 60 * 1000,
    });

    const { data: searchResults, isFetching: isSearching } = api.asset.search.useQuery(
        { query: debouncedQuery },
        {
            enabled: debouncedQuery.length >= 2,
            staleTime: 60 * 1000,
        }
    );

    // Scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Auth Effects (Vercel-optimized)
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                utils.user.getCurrentUser.setData(undefined, {
                    id: session.user.id,
                    email: session.user.email ?? "",
                    fullName: session.user.user_metadata?.full_name ?? null,
                    role: "buyer",
                });
                utils.user.getCurrentUser.invalidate();
            }
        });
    }, [pathname, utils]);

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

    // Handle Search Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle click outside for Search and User Menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(event.target as Node)
            ) {
                setIsSearchOpen(false);
            }
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(event.target as Node)
            ) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsSearchOpen(false);
                setIsUserMenuOpen(false);
                setIsMegaMenuOpen(false);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen);
        if (!isSearchOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    };

    const handleLogout = async () => {
        const supabase = createClient();
        utils.user.getCurrentUser.setData(undefined, null);
        supabase.auth.signOut();
        window.location.href = "/login";
    };

    if (isLoading) {
        return (
            <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/70 dark:bg-black/70 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                            <span className="text-indigo-600 dark:text-indigo-400">◆</span>
                            <span className="font-black uppercase tracking-tight">CODE<span className="text-indigo-600 dark:text-indigo-400">XCHANGE</span></span>
                        </Link>
                        <div className="h-8 w-32 animate-pulse rounded-lg bg-white/8" />
                        <div className="h-8 w-32 animate-pulse bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header
            className={cn(
                "sticky top-0 z-50 w-full transition-all duration-300 backdrop-blur-xl",
                isScrolled
                    ? "bg-white/80 dark:bg-black/80 border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm"
                    : "bg-white/50 dark:bg-black/50 border-b border-transparent"
            )}
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between gap-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white z-10 shrink-0">
                        <span className="text-indigo-600 dark:text-indigo-400">◆</span>
                        <span className="hidden sm:inline-block tracking-tight font-black uppercase">CODE<span className="text-indigo-600 dark:text-indigo-400">XCHANGE</span></span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8 h-full">
                        <Link href="/browse" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            Browse
                        </Link>

                        {/* Categories Mega Menu Trigger */}
                        <div
                            className="h-full flex items-center"
                            onMouseEnter={() => setIsMegaMenuOpen(true)}
                            onMouseLeave={() => setIsMegaMenuOpen(false)}
                        >
                            <button className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                Categories
                                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isMegaMenuOpen && "rotate-180")} />
                            </button>
                            <MegaMenu
                                isOpen={isMegaMenuOpen}
                                categories={categories}
                                onClose={() => setIsMegaMenuOpen(false)}
                            />
                        </div>

                        {user?.role === "admin" && (
                            <Link href="/admin" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                Admin Dashboard
                            </Link>
                        )}
                        {(user?.role === "builder" || user?.role === "admin") && (
                            <Link href="/asset/submit" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                Sell Asset
                            </Link>
                        )}
                    </nav>

                    {/* Right side: Search & Auth */}
                    <div className="flex items-center gap-2 sm:gap-4 z-10 shrink-0">
                        {/* Search Inline */}
                        <div className="relative flex items-center" ref={searchContainerRef}>
                            <div
                                className={cn(
                                    "flex items-center overflow-hidden transition-all duration-300 ease-out",
                                    isSearchOpen ? "w-48 sm:w-64 opacity-100" : "w-0 opacity-0"
                                )}
                            >
                                <div className="relative w-full pr-2">
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search assets..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-gray-100 dark:bg-gray-800 border-[1.5px] border-transparent outline-none focus:outline-none focus:border-indigo-500 focus:ring-0 focus:bg-white dark:focus:bg-gray-900 rounded-full py-1.5 pl-4 pr-3 text-sm transition-colors"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={toggleSearch}
                                className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <Search className="h-5 w-5" />
                            </button>

                            {/* Search Results Dropdown */}
                            {isSearchOpen && debouncedQuery.length >= 2 && (
                                <div className="absolute top-12 right-0 w-72 sm:w-80 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden z-50">
                                    {isSearching ? (
                                        <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
                                    ) : searchResults && searchResults.assets.length > 0 ? (
                                        <div className="py-2">
                                            {searchResults.assets.map((asset) => (
                                                <Link
                                                    key={asset.id}
                                                    href={`/asset/${asset.slug}`}
                                                    onClick={() => setIsSearchOpen(false)}
                                                    className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                >
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {asset.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {asset.category?.name || "Uncategorized"}
                                                    </div>
                                                </Link>
                                            ))}
                                            <div className="border-t border-gray-100 dark:border-gray-800 mt-2">
                                                <Link
                                                    href={`/browse?q=${encodeURIComponent(debouncedQuery)}`}
                                                    onClick={() => setIsSearchOpen(false)}
                                                    className="block px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 text-center hover:bg-gray-50 dark:hover:bg-gray-800 font-medium pt-3 -mb-2"
                                                >
                                                    View all results
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center text-sm text-gray-500">
                                            No assets found for &quot;{debouncedQuery}&quot;
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Auth Buttons */}
                        {user ? (
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                >
                                    <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="hidden sm:inline-block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {user.fullName?.split(" ")[0] || user.email?.split("@")[0]}
                                    </span>
                                </button>

                                {/* User Dropdown */}
                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 mb-2">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {user.fullName}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                {user.email}
                                            </p>
                                            <div className="mt-2.5 inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                                {user.role === "builder" ? "Builder" : user.role === "admin" ? "Admin" : "Buyer"}
                                            </div>
                                        </div>

                                        <Link href="/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <User className="h-4 w-4" /> Profile
                                        </Link>
                                        <Link href="/dashboard" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <LayoutDashboard className="h-4 w-4" /> Dashboard
                                        </Link>
                                        <Link href="/purchases" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <ShoppingBag className="h-4 w-4" /> My Purchases
                                        </Link>
                                        <Link href="/settings" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <Settings className="h-4 w-4" /> Settings
                                        </Link>

                                        <div className="border-t border-gray-100 dark:border-gray-800 my-2"></div>

                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 text-left">
                                            <LogOut className="h-4 w-4" /> Log out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center gap-2">
                                <Link href="/login">
                                    <Button variant="outline" size="sm" className="rounded-full !px-5 shadow-sm bg-white/50 backdrop-blur-sm border-gray-200">
                                        Log In
                                    </Button>
                                </Link>
                                <Link href="/signup">
                                    <Button size="sm" className="rounded-full !px-5 bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all hover:shadow text-white">
                                        Sign Up
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Panel */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full w-full bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-xl max-h-[80vh] overflow-y-auto z-40 transition-all origin-top">
                    <div className="px-4 py-6 space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Navigation</h4>
                            <Link href="/browse" onClick={() => setIsMobileMenuOpen(false)} className="block text-base font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 transition-colors">
                                Browse Assets
                            </Link>
                            <Link href="/browse" onClick={() => setIsMobileMenuOpen(false)} className="block text-base font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 transition-colors">
                                All Categories
                            </Link>
                            {user?.role === "admin" && (
                                <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block text-base font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 transition-colors">
                                    Admin Dashboard
                                </Link>
                            )}
                            {(user?.role === "builder" || user?.role === "admin") && (
                                <Link href="/asset/submit" onClick={() => setIsMobileMenuOpen(false)} className="block text-base font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 transition-colors">
                                    Sell Asset
                                </Link>
                            )}
                        </div>

                        {!user && (
                            <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-3">
                                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block">
                                    <Button variant="outline" className="w-full justify-center rounded-xl bg-gray-50 border-gray-200">Log In</Button>
                                </Link>
                                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="block">
                                    <Button className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 rounded-xl">Sign Up</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
