"use client";

import { Card } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export function AIDebtInsight() {
    return (
        <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-6">
                <div className="p-4 bg-blue-600 rounded-xl shrink-0 shadow-lg">
                    <Lightbulb className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">
                        AI Debt Insight
                    </h3>
                    <p className="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        "Total group spend is up 22% this month due to utility spikes. Sarah has paid for most
                        shared meals lately, settling up today would balance the 15% discrepancy in contributions."
                    </p>
                    <div className="mt-4 flex gap-6 text-sm text-zinc-600 dark:text-zinc-400">
                        <div>
                            <span className="font-semibold">Confidence:</span> 92%
                        </div>
                        <div>
                            <span className="font-semibold">Last Updated:</span> 2 hours ago
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
