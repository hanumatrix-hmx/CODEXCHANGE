"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

interface HeroSectionProps {
    stats: {
        totalTools: number;
        totalBuilders: number;
        totalCategories: number;
    };
}

function useCountUp(target: number, duration = 1400) {
    const [current, setCurrent] = useState(0);
    const started = useRef(false);

    useEffect(() => {
        if (started.current || target === 0) return;
        started.current = true;

        const startTime = performance.now();
        const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCurrent(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [target, duration]);

    return current;
}

export function HeroSection({ stats }: HeroSectionProps) {
    const router = useRouter();
    const [query, setQuery] = useState("");

    const tools = useCountUp(stats.totalTools);
    const builders = useCountUp(stats.totalBuilders);
    const categoriesCount = useCountUp(stats.totalCategories);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/browse?q=${encodeURIComponent(query.trim())}`);
        } else {
            router.push("/browse");
        }
    };

    return (
        <section className="hero-section relative overflow-hidden">
            {/* Noise texture overlay */}
            <div className="hero-noise" />

            {/* Grid lines */}
            <div className="hero-grid" />

            {/* Radial glow blobs */}
            <div className="hero-blob hero-blob-1" />
            <div className="hero-blob hero-blob-2" />

            <div className="relative z-10 mx-auto max-w-5xl px-6 py-24 text-center">
                {/* Badge */}
                <div
                    className="hero-animate hero-animate-1 mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-indigo-300 backdrop-blur-sm"
                >
                    <Zap className="h-3.5 w-3.5 fill-indigo-400 text-indigo-400" />
                    B2B AI &amp; Dev Tools Marketplace
                </div>

                {/* Headline */}
                <h1 className="hero-animate hero-animate-2 mt-4 bg-gradient-to-br from-white via-slate-200 to-indigo-300 bg-clip-text text-6xl font-extrabold leading-tight tracking-tight text-transparent sm:text-7xl">
                    Discover &amp; Deploy
                </h1>

                {/* Subhead */}
                <p className="hero-animate hero-animate-3 mt-5 text-lg font-medium text-slate-400 sm:text-xl">
                    AI Agents, Templates &amp; Enterprise Tools
                </p>

                {/* Search bar */}
                <form
                    onSubmit={handleSearch}
                    className="hero-animate hero-animate-4 mx-auto mt-10 flex max-w-xl items-center gap-3"
                >
                    <div className="search-glow relative flex flex-1 items-center rounded-2xl border border-white/10 bg-white/8 backdrop-blur-md">
                        <Search className="ml-4 h-5 w-5 shrink-0 text-slate-400" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search AI agents, templates, tools…"
                            className="flex-1 bg-transparent py-4 pl-3 pr-4 text-base text-white placeholder-slate-500 outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="shrink-0 rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-95"
                    >
                        Search
                    </button>
                </form>

                {/* Stats pills */}
                <div className="hero-animate hero-animate-5 mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-white">{tools}</span>
                        <span>Tools</span>
                    </div>
                    <div className="h-4 w-px bg-white/15" />
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-white">{builders}</span>
                        <span>Builders</span>
                    </div>
                    <div className="h-4 w-px bg-white/15" />
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-white">{categoriesCount}</span>
                        <span>Categories</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
