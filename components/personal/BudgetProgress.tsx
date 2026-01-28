"use client";

import { Card } from "@/components/ui/card";
import { Wallet } from "lucide-react";

interface BudgetProgressProps {
    spent: number;
    limit: number; // This is now the total income
}

export function BudgetProgress({ spent, limit }: BudgetProgressProps) {
    const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    const isOverBudget = spent > limit;

    return (
        <Card className="p-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                        <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">SPENDING TRACKER</p>
                        <p className="text-xl font-bold">
                            ${Math.abs(spent).toFixed(2)}
                            <span className="text-xs text-zinc-400 font-normal ml-1">
                                / ${limit.toFixed(2)}
                            </span>
                        </p>
                    </div>
                </div>
                <div className={`text-xs font-medium px-2 py-1 rounded-full ${isOverBudget
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                    {percentage.toFixed(0)}% Spent
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mt-3">
                <div
                    className={`absolute top-0 left-0 h-full transition-all duration-300 ${isOverBudget
                            ? 'bg-red-500 dark:bg-red-600'
                            : 'bg-blue-500 dark:bg-blue-600'
                        }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </Card>
    );
}
