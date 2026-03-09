"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function BackButton() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-6 transition-colors bg-transparent border-none p-0 cursor-pointer"
        >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
        </button>
    );
}
