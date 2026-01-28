"use client";

import { Utensils, Plane, ShoppingBag, Zap } from "lucide-react";

interface CategorySpendingProps {
    spendingByCategory: Record<string, { total: number; count: number }>;
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Utensils; budgetLimit: number; color: string }> = {
    Food: { icon: Utensils, budgetLimit: 1000, color: "orange" },
    Travel: { icon: Plane, budgetLimit: 500, color: "blue" },
    Groceries: { icon: ShoppingBag, budgetLimit: 800, color: "purple" },
    Rent_utilities: { icon: Zap, budgetLimit: 1500, color: "green" },
    Personal_utilities: { icon: Zap, budgetLimit: 400, color: "teal" },
    Other: { icon: Utensils, budgetLimit: 500, color: "gray" },
};

type ColorClasses = {
    bg: string;
    text: string;
    border: string;
    progress: string;
};

const COLOR_CLASSES_MAP: Record<string, ColorClasses> = {
    orange: {
        bg: "bg-orange-100 dark:bg-orange-900/30",
        text: "text-orange-600 dark:text-orange-400",
        border: "border-orange-200 dark:border-orange-800",
        progress: "bg-orange-500",
    },
    blue: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-200 dark:border-blue-800",
        progress: "bg-blue-500",
    },
    purple: {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        text: "text-purple-600 dark:text-purple-400",
        border: "border-purple-200 dark:border-purple-800",
        progress: "bg-purple-500",
    },
    green: {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-600 dark:text-green-400",
        border: "border-green-200 dark:border-green-800",
        progress: "bg-green-500",
    },
};

export function CategorySpending({ spendingByCategory }: CategorySpendingProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Spending by Category</h3>
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    Customize
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
                    const spent = spendingByCategory[category]?.total || 0;
                    const { icon: Icon, budgetLimit, color } = config;
                    const percentage = Math.min((spent / budgetLimit) * 100, 100);
                    const isOver = spent > budgetLimit;

                    const colorClasses: ColorClasses = COLOR_CLASSES_MAP[color] || COLOR_CLASSES_MAP.blue;

                    return (
                        <div
                            key={category}
                            className={`p-5 bg-white dark:bg-zinc-900 rounded-lg border ${colorClasses.border}`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-2 ${colorClasses.bg} rounded-lg`}>
                                    <Icon className={`h-5 w-5 ${colorClasses.text}`} />
                                </div>
                                <p className="text-xl font-bold">${spent.toFixed(2)}</p>
                            </div>
                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{category}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                                ${budgetLimit.toFixed(0)} limit
                            </p>

                            {/* Progress bar */}
                            <div className="relative w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
                                <div
                                    className={`absolute top-0 left-0 h-full ${colorClasses.progress} transition-all duration-300`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            <p className={`text-xs ${isOver ? 'text-red-600' : colorClasses.text}`}>
                                {percentage.toFixed(0)}%
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
