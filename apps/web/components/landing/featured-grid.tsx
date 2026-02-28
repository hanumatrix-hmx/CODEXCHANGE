"use client";

import { useEffect, useRef } from "react";
import { AssetCard, type Asset } from "@/components/asset-card";

export function FeaturedGrid({ assets }: { assets: Asset[] }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const cards = container.querySelectorAll<HTMLElement>(".feat-card");

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        (entry.target as HTMLElement).style.animationPlayState = "running";
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12 }
        );

        cards.forEach((card) => observer.observe(card));
        return () => observer.disconnect();
    }, [assets]);

    if (!assets.length) {
        return (
            <section className="mx-auto max-w-7xl px-6 py-12 text-center text-slate-500">
                No featured tools yet — check back soon.
            </section>
        );
    }

    return (
        <section className="mx-auto max-w-7xl px-6 py-6">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Featured Listings</h2>
                    <p className="mt-1 text-sm text-slate-500">Hand-picked, production-ready tools</p>
                </div>
                <a
                    href="/browse"
                    className="text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
                >
                    View all →
                </a>
            </div>

            <div ref={containerRef} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {assets.map((asset, i) => (
                    <div
                        key={asset.id}
                        className="feat-card"
                        style={{
                            opacity: 0,
                            animation: `featCardIn 0.5s ease forwards`,
                            animationDelay: `${i * 80}ms`,
                            animationPlayState: "paused",
                        }}
                    >
                        {/* Dark card wrapper */}
                        <div className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10">
                            <AssetCard asset={asset} variant="dark" />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
