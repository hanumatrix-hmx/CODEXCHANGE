import * as React from "react";
import { cn } from "@/utils/cn";
import { LucideIcon } from "lucide-react";

export interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
}

export function StatCard({ title, value, description, icon: Icon, trend, className }: StatCardProps) {
    return (
        <div
            className={cn(
                "rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md",
                className
            )}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
                    {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
                    {trend && (
                        <div className="mt-2 flex items-center text-sm">
                            <span
                                className={cn(
                                    "font-medium",
                                    trend.isPositive ? "text-green-600" : "text-red-600"
                                )}
                            >
                                {trend.isPositive ? "+" : ""}
                                {trend.value}%
                            </span>
                            <span className="ml-2 text-gray-500">from last month</span>
                        </div>
                    )}
                </div>
                {Icon && (
                    <div className="ml-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                        <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                )}
            </div>
        </div>
    );
}
