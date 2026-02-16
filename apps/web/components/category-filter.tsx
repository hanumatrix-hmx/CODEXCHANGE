"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/utils/cn";

export interface Category {
    id: string;
    name: string;
    slug: string;
}

export function CategoryFilter({ categories }: { categories: Category[] }) {
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get("category");

    return (
        <div className="mb-8 flex flex-wrap gap-2">
            <Link
                href="/browse"
                className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    !currentCategory
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
            >
                All
            </Link>
            {categories.map((category) => (
                <Link
                    key={category.id}
                    href={`/browse?category=${category.slug}`}
                    className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        currentCategory === category.slug
                            ? "bg-black text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                >
                    {category.name}
                </Link>
            ))}
        </div>
    );
}
