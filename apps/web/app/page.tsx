import {
    getFeaturedAssets,
    getAllCategories,
    getMarketplaceStats,
} from "@codexchange/db/src/queries";
import { HeroSection } from "@/components/landing/hero-section";
import { CategoryPills } from "@/components/landing/category-pills";
import { FeaturedGrid } from "@/components/landing/featured-grid";
import { CategoryIconGrid } from "@/components/landing/category-icon-grid";
import { BuilderCta } from "@/components/landing/builder-cta";
import { LandingFooter } from "@/components/landing/landing-footer";
import type { Asset } from "@/components/asset-card";

export const metadata = {
    title: "CODEXCHANGE — Discover & Deploy AI Agents, Templates & Enterprise Tools",
    description:
        "The premium B2B marketplace for AI agents, developer tools, and enterprise software. Browse, evaluate, and purchase with ownership rights.",
};

export default async function LandingPage() {
    // Parallel data fetching — all three queries run simultaneously
    const [stats, categories, rawAssets] = await Promise.all([
        getMarketplaceStats(),
        getAllCategories(),
        getFeaturedAssets(6),
    ]);

    const assets = rawAssets as unknown as Asset[];

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100">
            {/* 1 — Hero */}
            <HeroSection stats={stats} />

            {/* 2 — Category pills */}
            <div className="py-8">
                <CategoryPills categories={categories} />
            </div>

            {/* Divider */}
            <div className="mx-auto max-w-7xl px-6">
                <div className="h-px bg-white/5" />
            </div>

            {/* 3 — Featured listings */}
            <div className="py-10">
                <FeaturedGrid assets={assets} />
            </div>

            {/* Divider */}
            <div className="mx-auto max-w-7xl px-6">
                <div className="h-px bg-white/5" />
            </div>

            {/* 4 — Browse by category icon grid */}
            <div className="py-10">
                <CategoryIconGrid categories={categories} />
            </div>

            {/* Divider */}
            <div className="mx-auto max-w-7xl px-6">
                <div className="h-px bg-white/5" />
            </div>

            {/* 5 — For builders CTA */}
            <div className="py-10">
                <BuilderCta />
            </div>

            {/* 6 — Footer */}
            <LandingFooter />
        </main>
    );
}
