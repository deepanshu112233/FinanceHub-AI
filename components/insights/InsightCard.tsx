"use client";

import { Signal } from "@/lib/signal/domain/Signal";
import { TrendingUp, TrendingDown, AlertTriangle, Activity } from "lucide-react";

interface InsightCardProps {
    signal: Signal;
}

const SEVERITY_COLORS = {
    HIGH: {
        bg: "bg-red-50 dark:bg-red-950/30",
        border: "border-red-200 dark:border-red-800",
        text: "text-red-900 dark:text-red-100",
        badge: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
    },
    MEDIUM: {
        bg: "bg-orange-50 dark:bg-orange-950/30",
        border: "border-orange-200 dark:border-orange-800",
        text: "text-orange-900 dark:text-orange-100",
        badge: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300",
    },
    LOW: {
        bg: "bg-blue-50 dark:bg-blue-950/30",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-900 dark:text-blue-100",
        badge: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    },
};

const TYPE_ICONS = {
    TREND: TrendingUp,
    ANOMALY: AlertTriangle,
    VOLATILITY: Activity,
    BUDGET_PRESSURE: TrendingDown,
    BEHAVIOR_PATTERN: Activity,
    GROUP_IMBALANCE: Activity,
    FORECAST_RISK: AlertTriangle,
};

export function InsightCard({ signal }: InsightCardProps) {
    const colors = SEVERITY_COLORS[signal.severity];
    const Icon = TYPE_ICONS[signal.type] || Activity;

    return (
        <div
            className={`rounded-lg border-2 p-5 transition-all hover:shadow-md h-full ${colors.bg} ${colors.border}`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colors.badge}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className={`font-semibold text-lg ${colors.text}`}>
                            {signal.title}
                        </h3>
                        {signal.category && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 capitalize">
                                {signal.category.replace(/_/g, " ")}
                            </p>
                        )}
                    </div>
                </div>
                <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors.badge}`}
                >
                    {signal.severity}
                </span>
            </div>

            <p className={`text-sm mb-3 ${colors.text}`}>{signal.message}</p>

            {signal.dateRange && (
                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <Activity className="h-3.5 w-3.5" />
                    <span>{signal.dateRange}</span>
                    {signal.confidence !== undefined && (
                        <>
                            <span>•</span>
                            <span>Confidence: {Math.round((signal.confidence ?? 0) * 100)}%</span>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
