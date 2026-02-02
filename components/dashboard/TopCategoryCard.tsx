"use client";

import { Card } from "@/components/ui/card";
import { Tag } from "lucide-react";

interface TopCategoryCardProps {
    category: string | null;
    amount: number;
    percentage: number;
}

// Category icons mapping
const categoryIcons: Record<string, string> = {
    Food: "🍔",
    Transport: "🚗",
    Entertainment: "🎬",
    Shopping: "🛍️",
    Bills: "📄",
    Healthcare: "⚕️",
    Education: "📚",
    Other: "📦",
};

export function TopCategoryCard({ category, amount, percentage }: TopCategoryCardProps) {
    if (!category) {
        return (
            <Card className="p-6">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Top Category</p>
                    <div className="flex items-center gap-3 py-2">
                        <div className="text-4xl">📦</div>
                        <div>
                            <p className="font-semibold text-zinc-900 dark:text-white">No data</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                No expenses this month
                            </p>
                        </div>
                    </div>
                </div>
            </Card>
        );
    }

    const icon = categoryIcons[category] || "📦";

    return (
        <Card className="p-6">
            <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Top Category</p>
                <div className="flex items-center gap-3">
                    <div className="text-4xl">{icon}</div>
                    <div className="flex-1">
                        <p className="font-semibold text-zinc-900 dark:text-white">{category}</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-blue-600">${amount.toFixed(2)}</p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                ({percentage.toFixed(0)}%)
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
