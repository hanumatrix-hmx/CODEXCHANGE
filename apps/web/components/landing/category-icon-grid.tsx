"use client";

import Link from "next/link";

interface Category {
    id: string;
    name: string;
    slug: string;
}

// Slug → emoji icon mapping. Falls back to 🧩
const CATEGORY_ICONS: Record<string, string> = {
    "ai-agents": "🤖",
    "coding-assistants": "💻",
    "connectors": "🔌",
    "support": "💬",
    "data-tools": "📊",
    "datasets": "📚",
    "finance": "💰",
    "image-gen": "🎨",
    "llms": "🧠",
    "marketing": "📈",
    "plugins": "🧩",
    "productivity": "⚡",
    "source-code": "👨‍💻",
    "templates": "🗂️",
    "utilities": "🛠️",
    "voice-ai": "🎙️",
};

const TILE_COLOURS = [
    "hover:border-indigo-500/40 hover:bg-indigo-500/8 hover:shadow-indigo-500/10",
    "hover:border-violet-500/40 hover:bg-violet-500/8 hover:shadow-violet-500/10",
    "hover:border-blue-500/40 hover:bg-blue-500/8 hover:shadow-blue-500/10",
    "hover:border-cyan-500/40 hover:bg-cyan-500/8 hover:shadow-cyan-500/10",
    "hover:border-teal-500/40 hover:bg-teal-500/8 hover:shadow-teal-500/10",
    "hover:border-emerald-500/40 hover:bg-emerald-500/8 hover:shadow-emerald-500/10",
    "hover:border-purple-500/40 hover:bg-purple-500/8 hover:shadow-purple-500/10",
    "hover:border-pink-500/40 hover:bg-pink-500/8 hover:shadow-pink-500/10",
];

export function CategoryIconGrid({ categories }: { categories: Category[] }) {
    return (
        <section className="mx-auto max-w-7xl px-6 py-6">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">Browse by Category</h2>
                <p className="mt-1 text-sm text-slate-500">Find exactly what your team needs</p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4">
                {categories.map((cat, i) => (
                    <Link
                        key={cat.id}
                        href={`/browse?category=${cat.slug}`}
                        className={`group flex flex-col items-center gap-3 rounded-2xl border border-white/8 bg-white/3 p-6 text-center shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-lg ${TILE_COLOURS[i % TILE_COLOURS.length]}`}
                    >
                        <span className="text-3xl">
                            {CATEGORY_ICONS[cat.slug] ?? "🧩"}
                        </span>
                        <span className="text-sm font-medium text-slate-300 transition group-hover:text-white">
                            {cat.name}
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
