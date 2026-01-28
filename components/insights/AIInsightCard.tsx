"use client";

import { Brain, TrendingUp, AlertCircle } from "lucide-react";

export function AIInsightCard() {
    return (
        <div className="w-full h-full bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                    <Brain className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                    AI Insights
                </h2>
            </div>

            {/* Placeholder Content */}
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="mx-auto w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        AI-powered insights coming soon
                    </p>
                </div>
            </div>
        </div>
    );
}
