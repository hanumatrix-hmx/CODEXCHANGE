"use client";

import Link from "next/link";

interface Category {
    id: string;
    name: string;
    slug: string;
}

const PILL_COLOURS = [
    "bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/30 border-indigo-500/20",
    "bg-violet-500/15 text-violet-300 hover:bg-violet-500/30 border-violet-500/20",
    "bg-blue-500/15 text-blue-300 hover:bg-blue-500/30 border-blue-500/20",
    "bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/30 border-cyan-500/20",
    "bg-teal-500/15 text-teal-300 hover:bg-teal-500/30 border-teal-500/20",
    "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/20",
    "bg-purple-500/15 text-purple-300 hover:bg-purple-500/30 border-purple-500/20",
    "bg-pink-500/15 text-pink-300 hover:bg-pink-500/30 border-pink-500/20",
];

export function CategoryPills({ categories }: { categories: Category[] }) {
    if (!categories.length) return null;

    return (
        <div className="relative">
            {/* Scroll container */}
            <div className="scrollbar-hide flex gap-3 overflow-x-auto px-6 py-2 sm:justify-center">
                <Link
                    href="/browse"
                    className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                    All
                </Link>
                {categories.map((cat, i) => (
                    <Link
                        key={cat.id}
                        href={`/browse?category=${cat.slug}`}
                        className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all hover:scale-105 ${PILL_COLOURS[i % PILL_COLOURS.length]}`}
                    >
                        {cat.name}
                    </Link>
                ))}
            </div>

            {/* Fade edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-slate-950 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-slate-950 to-transparent" />
        </div>
    );
}
