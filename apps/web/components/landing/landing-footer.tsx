"use client";

import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";

const CURRENT_YEAR = 2026;

export function LandingFooter() {
    return (
        <footer className="border-t border-white/5 bg-slate-950">
            <div className="mx-auto max-w-7xl px-6 py-14">
                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div className="col-span-1 lg:col-span-1">
                        <Link href="/" className="text-xl font-extrabold tracking-tight text-white">
                            CODE<span className="text-indigo-400">XCHANGE</span>
                        </Link>
                        <p className="mt-3 max-w-xs text-sm text-slate-500">
                            The premium B2B marketplace for AI agents, dev tools, and enterprise
                            software.
                        </p>
                        <div className="mt-5 flex gap-4">
                            {[
                                { icon: Github, href: "https://github.com", label: "GitHub" },
                                { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
                                { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
                            ].map(({ icon: Icon, href, label }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-slate-400 transition hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-400"
                                >
                                    <Icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Marketplace */}
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                            Marketplace
                        </p>
                        <ul className="space-y-3 text-sm text-slate-400">
                            {[
                                { label: "Browse All", href: "/browse" },
                                { label: "AI Agents", href: "/browse?category=ai-agents" },
                                { label: "Templates", href: "/browse?category=templates" },
                                { label: "Enterprise Tools", href: "/browse?category=enterprise-tools" },
                            ].map(({ label, href }) => (
                                <li key={label}>
                                    <Link href={href} className="transition hover:text-white">
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Builders */}
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                            Builders
                        </p>
                        <ul className="space-y-3 text-sm text-slate-400">
                            {[
                                { label: "Start Selling", href: "/onboarding" },
                                { label: "Dashboard", href: "/dashboard" },
                                { label: "Submit Asset", href: "/asset/submit" },
                            ].map(({ label, href }) => (
                                <li key={label}>
                                    <Link href={href} className="transition hover:text-white">
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                            Company
                        </p>
                        <ul className="space-y-3 text-sm text-slate-400">
                            {[
                                { label: "About", href: "#" },
                                { label: "Privacy Policy", href: "#" },
                                { label: "Terms of Service", href: "#" },
                                { label: "Contact", href: "#" },
                            ].map(({ label, href }) => (
                                <li key={label}>
                                    <Link href={href} className="transition hover:text-white">
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-sm text-slate-600 sm:flex-row">
                    <p>© {CURRENT_YEAR} CODEXCHANGE. All rights reserved.</p>
                    <p>Made with ❤️ for builders in India</p>
                </div>
            </div>
        </footer>
    );
}
