"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp, ShieldCheck, Zap } from "lucide-react";

export function BuilderCta() {
    return (
        <section className="mx-auto max-w-7xl px-6 py-6">
            <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950 via-violet-950 to-slate-950 px-8 py-14 shadow-2xl">
                {/* Blobs */}
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />

                <div className="relative z-10 mx-auto max-w-3xl text-center">
                    {/* Revenue badge */}
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-400">
                        <TrendingUp className="h-4 w-4" />
                        80–85% Revenue Share — Keep More of What You Build
                    </div>

                    <h2 className="bg-gradient-to-br from-white to-slate-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
                        Start Selling Your Code
                    </h2>

                    <p className="mt-4 text-lg text-slate-400">
                        Join hundreds of builders selling AI agents, scripts, and enterprise tools to
                        businesses across India. Get paid in 48 hours.
                    </p>

                    {/* Feature bullets */}
                    <div className="mx-auto mt-8 flex max-w-lg flex-wrap justify-center gap-4 text-sm text-slate-300">
                        {[
                            { icon: ShieldCheck, label: "Verified buyer base" },
                            { icon: Zap, label: "Instant licence delivery" },
                            { icon: TrendingUp, label: "Real-time analytics" },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-indigo-400" />
                                {label}
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <Link
                            href="/onboarding"
                            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-600/40 transition hover:bg-indigo-500 hover:shadow-indigo-500/50 active:scale-95"
                        >
                            Become a Builder
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/browse"
                            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-8 py-4 text-base font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
                        >
                            Browse the Marketplace
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
