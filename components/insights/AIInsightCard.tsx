"use client";

import { useState, useEffect } from "react";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, CheckCircle2, Loader2, RefreshCw, Minus } from "lucide-react";

interface AIHighlight {
    type: "warning" | "tip" | "positive";
    text: string;
}

interface AIReport {
    summary: string;
    highlights: AIHighlight[];
    topCategory: { name: string; percentage: number; trend: "up" | "down" | "stable" };
    monthOverMonth: { change: number; direction: "up" | "down" | "stable" };
    score: number;
}

export function AIInsightCard() {
    const [report, setReport] = useState<AIReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReport = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const res = await fetch("/api/insights/ai-report");

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: "Unknown error" }));
                throw new Error(data.error || "Failed to fetch report");
            }

            const data = await res.json();
            if (data.report) {
                setReport(data.report);
            } else {
                setError(data.message || "No data available");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load report");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const getHighlightIcon = (type: string) => {
        switch (type) {
            case "warning":
                return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            case "tip":
                return <Lightbulb className="w-4 h-4 text-blue-500" />;
            case "positive":
                return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            default:
                return <Lightbulb className="w-4 h-4 text-zinc-400" />;
        }
    };

    const getHighlightBg = (type: string) => {
        switch (type) {
            case "warning":
                return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50";
            case "tip":
                return "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50";
            case "positive":
                return "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50";
            default:
                return "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800";
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
        if (score >= 50) return "text-amber-600 dark:text-amber-400";
        return "text-red-600 dark:text-red-400";
    };

    const getScoreRingColor = (score: number) => {
        if (score >= 75) return "stroke-emerald-500";
        if (score >= 50) return "stroke-amber-500";
        return "stroke-red-500";
    };

    const getTrendIcon = (direction: string) => {
        switch (direction) {
            case "up":
                return <TrendingUp className="w-4 h-4 text-red-500" />;
            case "down":
                return <TrendingDown className="w-4 h-4 text-emerald-500" />;
            default:
                return <Minus className="w-4 h-4 text-zinc-400" />;
        }
    };

    // Score ring SVG
    const renderScoreRing = (score: number) => {
        const radius = 36;
        const circumference = 2 * Math.PI * radius;
        const progress = (score / 100) * circumference;

        return (
            <svg width="88" height="88" viewBox="0 0 88 88" className="shrink-0">
                <circle cx="44" cy="44" r={radius} fill="none" strokeWidth="6" className="stroke-zinc-200 dark:stroke-zinc-800" />
                <circle
                    cx="44" cy="44" r={radius} fill="none" strokeWidth="6"
                    strokeDasharray={`${progress} ${circumference}`}
                    strokeLinecap="round"
                    className={getScoreRingColor(score)}
                    transform="rotate(-90 44 44)"
                />
                <text x="44" y="40" textAnchor="middle" className={`text-lg font-bold fill-current ${getScoreColor(score)}`}>
                    {score}
                </text>
                <text x="44" y="55" textAnchor="middle" className="text-[9px] fill-zinc-400">
                    /100
                </text>
            </svg>
        );
    };

    return (
        <div className="w-full h-full bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 sm:p-6 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                        <Brain className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-base sm:text-xl font-bold text-zinc-900 dark:text-white">
                        AI Observation Report
                    </h2>
                </div>
                {!isLoading && (
                    <button
                        onClick={fetchReport}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        title="Refresh report"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex-1 flex items-center justify-center py-8">
                    <div className="text-center space-y-3">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Generating AI report...</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {!isLoading && error && (
                <div className="flex-1 flex items-center justify-center py-8">
                    <div className="text-center space-y-3">
                        <div className="mx-auto w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-zinc-400" />
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
                        <button
                            onClick={fetchReport}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            )}

            {/* Report Content */}
            {!isLoading && report && (
                <div className="flex-1 space-y-4 overflow-y-auto">
                    {/* Score + Summary Row */}
                    <div className="flex items-start gap-4">
                        {renderScoreRing(report.score)}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                                Financial Health
                            </p>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                {report.summary}
                            </p>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-100 dark:border-zinc-800">
                            <p className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400 font-semibold mb-1">
                                Top Category
                            </p>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                {report.topCategory.name}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {report.topCategory.percentage.toFixed(0)}% of spending
                            </p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-100 dark:border-zinc-800">
                            <p className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400 font-semibold mb-1">
                                Month vs Month
                            </p>
                            <div className="flex items-center gap-1.5">
                                {getTrendIcon(report.monthOverMonth.direction)}
                                <span className="text-sm font-bold text-zinc-900 dark:text-white">
                                    {report.monthOverMonth.change > 0 ? "+" : ""}
                                    {report.monthOverMonth.change.toFixed(1)}%
                                </span>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {report.monthOverMonth.direction === "up" ? "Spending increased" : report.monthOverMonth.direction === "down" ? "Spending decreased" : "No change"}
                            </p>
                        </div>
                    </div>

                    {/* Highlights */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            Key Observations
                        </p>
                        {report.highlights.map((h, i) => (
                            <div
                                key={i}
                                className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${getHighlightBg(h.type)}`}
                            >
                                <div className="mt-0.5 shrink-0">{getHighlightIcon(h.type)}</div>
                                <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{h.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
