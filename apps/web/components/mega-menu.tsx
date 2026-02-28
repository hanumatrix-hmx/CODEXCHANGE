"use client";

import Link from "next/link";
import { cn } from "@/utils/cn";
import { useEffect, useState } from "react";

const CATEGORY_ICONS: Record<string, string> = {
    "ai-agents": "🤖",
    "coding-assistants": "💻",
    "connectors": "🔌",
    "support": "🎧",
    "data-tools": "📊",
    "datasets": "🧠",
    "finance": "📈",
    "image-gen": "🎨",
    "llms": "💬",
    "marketing": "🚀",
    "plugins": "🧩",
    "productivity": "⚡",
    "source-code": "📦",
    "templates": "📋",
    "utilities": "🧰",
    "voice-ai": "🎙️",
};

export interface CategoryProps {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    assetCount: number;
}

interface MegaMenuProps {
    isOpen: boolean;
    categories: CategoryProps[] | undefined;
    onClose: () => void;
}

export function MegaMenu({ isOpen, categories, onClose }: MegaMenuProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <div
            className={cn(
                "absolute left-0 top-full w-full bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-xl transition-all duration-300 ease-in-out origin-top",
                isOpen
                    ? "opacity-100 translate-y-0 visible pointer-events-auto"
                    : "opacity-0 -translate-y-2 invisible pointer-events-none"
            )}
            onMouseLeave={onClose}
        >
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {categories && categories.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/browse?category=${category.slug}`}
                                className="group flex flex-col p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                                onClick={onClose}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl bg-gray-100 dark:bg-gray-800 rounded-lg p-2 group-hover:scale-110 transition-transform">
                                        {CATEGORY_ICONS[category.slug] || "📦"}
                                    </span>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                            {category.name}
                                        </h3>
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full inline-block mt-1 transition-colors">
                                            {category.assetCount} assets
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                    {category.description}
                                </p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        Loading categories...
                    </div>
                )}
            </div>
        </div>
    );
}
