import * as React from "react";
import { cn } from "@/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "success" | "warning" | "danger" | "info" | "secondary";
    size?: "sm" | "md" | "lg";
}

const variantStyles = {
    default: "bg-gray-100 text-gray-800 ring-gray-500/10",
    success: "bg-green-50 text-green-700 ring-green-600/20",
    warning: "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
    danger: "bg-red-50 text-red-700 ring-red-600/20",
    info: "bg-blue-50 text-blue-700 ring-blue-700/10",
    secondary: "bg-purple-50 text-purple-700 ring-purple-700/10",
};

const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
};

export function Badge({
    variant = "default",
    size = "md",
    className,
    children,
    ...props
}: BadgeProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full font-medium ring-1 ring-inset",
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
