"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    List,
    BarChart3,
    DollarSign,
    Settings,
    Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

export default function BuilderDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const navItems = [
        { name: "Overview", href: "/dashboard/builder", icon: LayoutDashboard },
        { name: "Listings", href: "/dashboard/builder/listings", icon: List },
        { name: "Analytics", href: "/dashboard/builder/analytics", icon: BarChart3 },
        { name: "Earnings", href: "/dashboard/builder/earnings", icon: DollarSign },
        { name: "Settings", href: "/dashboard/builder/settings", icon: Settings },
    ];

    return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-[#FBFBFC] dark:bg-black">
            {/* Sidebar */}
            <aside className="fixed top-16 z-40 hidden w-[240px] flex-col border-r border-gray-200 bg-white/80 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/80 md:flex h-[calc(100vh-4rem)]">
                <div className="flex flex-col gap-2 p-4 pt-6">
                    <Link href="/asset/submit">
                        <Button className="w-full justify-start rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all hover:shadow focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                            <Plus className="mr-2 h-4 w-4" />
                            Submit New Asset
                        </Button>
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-2">
                    <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Menu
                    </div>
                    <nav className="flex flex-col gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-indigo-50/80 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
                                    )}
                                >
                                    <Icon className={cn("h-[18px] w-[18px]", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400")} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-[240px] relative">
                <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
