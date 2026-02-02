"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface IncomeCardProps {
    current: number;
    previous: number;
    change: number;
}

export function IncomeCard({ current, previous, change }: IncomeCardProps) {
    const isPositive = change >= 0;

    return (
        <Card className="p-6">
            <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Income</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-zinc-900 dark:text-white">
                        ${current.toFixed(2)}
                    </h3>
                    {change !== 0 && (
                        <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {isPositive ? (
                                <TrendingUp className="w-4 h-4" />
                            ) : (
                                <TrendingDown className="w-4 h-4" />
                            )}
                            {Math.abs(change).toFixed(1)}%
                        </div>
                    )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    vs ${previous.toFixed(2)} last month
                </p>
            </div>
        </Card>
    );
}
