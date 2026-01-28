"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp, Scale, Loader2 } from "lucide-react";
import { useGroupData } from "@/contexts/GroupDataContext";

export function GroupStats() {
    const { data, isLoading } = useGroupData();

    const totalSpend = data?.totalSpend || 0;
    const userBalance = data?.userBalance || 0;
    const isOwed = userBalance < 0;

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6">
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Group Spend */}
            <Card className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                            Total Group Spend
                        </p>
                        <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                            ${totalSpend.toFixed(2)}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            All expenses combined
                        </p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>
            </Card>

            {/* Balance Status */}
            <Card className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                            Your Balance
                        </p>
                        <p className={`text-3xl font-bold ${isOwed ? 'text-red-600 dark:text-red-400' : userBalance === 0 ? 'text-zinc-900 dark:text-white' : 'text-green-600 dark:text-green-400'
                            }`}>
                            {userBalance === 0 ? '$0.00' : `${isOwed ? '-' : '+'}$${Math.abs(userBalance).toFixed(2)}`}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            {userBalance === 0 ? 'All settled up' : isOwed ? 'You owe overall' : 'You are owed overall'}
                        </p>
                    </div>
                    <div className={`p-3 rounded-lg ${isOwed ? 'bg-red-100 dark:bg-red-900/30' : userBalance === 0 ? 'bg-zinc-100 dark:bg-zinc-800' : 'bg-green-100 dark:bg-green-900/30'
                        }`}>
                        <Scale className={`w-5 h-5 ${isOwed ? 'text-red-600 dark:text-red-400' : userBalance === 0 ? 'text-zinc-600 dark:text-zinc-400' : 'text-green-600 dark:text-green-400'
                            }`} />
                    </div>
                </div>
            </Card>
        </div>
    );
}
