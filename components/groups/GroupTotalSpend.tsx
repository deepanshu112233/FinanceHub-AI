"use client";

import { useGroupData } from "@/contexts/GroupDataContext";
import { TrendingUp } from "lucide-react";

export function GroupTotalSpend() {
    const { data } = useGroupData();
    const totalSpend = data?.totalSpend || 0;

    return (
        <div className="flex items-center gap-3 px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-900 w-full sm:w-auto">
            <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
                <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide font-semibold">Total Group Spend</p>
                <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">${totalSpend.toFixed(2)}</p>
            </div>
        </div>
    );
}
