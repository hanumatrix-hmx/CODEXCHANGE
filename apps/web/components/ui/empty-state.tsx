import * as React from "react";
import { cn } from "@/utils/cn";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";

export interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
            {Icon && (
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <Icon className="h-8 w-8 text-gray-400" />
                </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-2 max-w-md text-sm text-gray-500">{description}</p>
            {action && (
                <Button onClick={action.onClick} className="mt-6">
                    {action.label}
                </Button>
            )}
        </div>
    );
}
