import * as React from "react";
import { Badge } from "./ui/badge";
import { Crown, Award, Medal } from "lucide-react";

export type QualityTier = "bronze" | "silver" | "gold" | "platinum";

export interface QualityBadgeProps {
    tier: QualityTier;
    showIcon?: boolean;
    size?: "sm" | "md" | "lg";
}

const tierConfig = {
    bronze: {
        label: "Bronze",
        variant: "secondary" as const,
        icon: Medal,
        description: "Automated quality checks passed",
    },
    silver: {
        label: "Silver",
        variant: "info" as const,
        icon: Award,
        description: "Human reviewed and verified",
    },
    gold: {
        label: "Gold",
        variant: "warning" as const,
        icon: Crown,
        description: "Premium quality, highly recommended",
    },
    platinum: {
        label: "Platinum",
        variant: "default" as const,
        icon: Crown,
        description: "Elite tier, exceptional quality",
    },
};

export function QualityBadge({ tier, showIcon = true, size = "md" }: QualityBadgeProps) {
    const config = tierConfig[tier];
    const Icon = config.icon;

    return (
        <Badge variant={config.variant} size={size} title={config.description}>
            {showIcon && <Icon className="mr-1 h-3 w-3" />}
            {config.label}
        </Badge>
    );
}
