import * as React from "react";
import { cn } from "@/utils/cn";

export function LoadingSkeleton({ className }: { className?: string }) {
    return <div className={cn("animate-pulse rounded-md bg-gray-200", className)} />;
}

export function CardSkeleton() {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
            <LoadingSkeleton className="mb-4 h-48 w-full" />
            <LoadingSkeleton className="mb-2 h-4 w-3/4" />
            <LoadingSkeleton className="mb-4 h-4 w-1/2" />
            <LoadingSkeleton className="h-8 w-full" />
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-12 w-full" />
            ))}
        </div>
    );
}

export function StatCardSkeleton() {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
            <LoadingSkeleton className="mb-2 h-4 w-24" />
            <LoadingSkeleton className="mb-2 h-8 w-32" />
            <LoadingSkeleton className="h-3 w-40" />
        </div>
    );
}
