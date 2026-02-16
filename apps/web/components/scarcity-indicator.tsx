import * as React from "react";
import { cn } from "@/utils/cn";
import { AlertTriangle } from "lucide-react";

export interface ScarcityIndicatorProps {
    total: number;
    remaining: number;
    licenseType: "usage" | "source";
    className?: string;
}

export function ScarcityIndicator({ total, remaining, licenseType, className }: ScarcityIndicatorProps) {
    const percentage = (remaining / total) * 100;
    const isLow = percentage < 20;
    const isCritical = percentage < 10;

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">
                    {remaining} of {total} {licenseType} licenses remaining
                </span>
                {isLow && (
                    <span className="flex items-center text-orange-600">
                        <AlertTriangle className="mr-1 h-4 w-4" />
                        {isCritical ? "Almost gone!" : "Low stock"}
                    </span>
                )}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                    className={cn(
                        "h-full transition-all duration-300",
                        isCritical
                            ? "bg-red-500"
                            : isLow
                                ? "bg-orange-500"
                                : "bg-green-500"
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
