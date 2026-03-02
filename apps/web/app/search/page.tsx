import { Suspense } from "react";
import { SearchContent } from "@/app/search/search-content";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Search Results | Codexchange",
    description: "Search for high-quality production-ready code assets",
};

export const dynamic = 'force-dynamic';

export default function SearchPage() {
    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pt-24 pb-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Add suspense boundary here for useSearchParams */}
                    <Suspense fallback={
                        <div className="w-full h-96 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    }>
                        <SearchContent />
                    </Suspense>
                </div>
            </div>
        </main>
    );
}
