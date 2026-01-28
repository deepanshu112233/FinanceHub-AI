"use client";

import { useState, useEffect } from "react";
import { Signal } from "@/lib/signal/domain/Signal";
import { EWMAPoint } from "@/lib/signal/domain/Aggregates";
import { InsightCard } from "./InsightCard";
import { UnifiedSpendChart } from "./UnifiedSpendChart";
import { Loader2 } from "lucide-react";

const CACHE_KEY = "ai_insights_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CachedData {
    signals: Signal[];
    chartData: Record<string, EWMAPoint[]>;
    timestamp: number;
}

export function AIInsightsView() {
    const [signals, setSignals] = useState<Signal[]>([]);
    const [chartData, setChartData] = useState<Record<string, EWMAPoint[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Check cache first
            const cachedData = getCachedData();
            if (cachedData) {
                console.log("✅ Using cached AI insights");
                setSignals(cachedData.signals);
                setChartData(cachedData.chartData);
                setIsLoading(false);
                return;
            }

            // Fetch fresh data if cache is invalid/expired
            console.log("🔄 Fetching fresh AI insights");
            const response = await fetch("/api/analyze");
            if (response.ok) {
                const data = await response.json();
                setSignals(data.signals || []);
                setChartData(data.chartData || {});

                // Cache the fetched data
                setCachedData({
                    signals: data.signals || [],
                    chartData: data.chartData || {},
                    timestamp: Date.now(),
                });
            } else {
                const errData = await response.json();
                setError(errData.error || "Failed to load insights");
            }
        } catch (err) {
            console.error("Failed to fetch insights:", err);
            setError("Network error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    // Get cached data if valid
    const getCachedData = (): CachedData | null => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;

            const data: CachedData = JSON.parse(cached);
            const now = Date.now();

            // Check if cache is still valid (within CACHE_DURATION)
            if (now - data.timestamp < CACHE_DURATION) {
                return data;
            }

            // Cache expired, remove it
            localStorage.removeItem(CACHE_KEY);
            return null;
        } catch (error) {
            console.error("Error reading cache:", error);
            return null;
        }
    };

    // Set cached data
    const setCachedData = (data: CachedData) => {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error("Error setting cache:", error);
        }
    };

    // Expose cache invalidation function (can be called from other components)
    useEffect(() => {
        // Listen for custom event to invalidate cache
        const handleInvalidateCache = () => {
            console.log("🗑️ Cache invalidated");
            localStorage.removeItem(CACHE_KEY);
            fetchInsights();
        };

        window.addEventListener("invalidate-insights-cache", handleInvalidateCache);
        return () => {
            window.removeEventListener("invalidate-insights-cache", handleInvalidateCache);
        };
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Analyzing your spending patterns...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                        Error Loading Insights
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-4">{error}</p>
                    <button
                        onClick={fetchInsights}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (signals.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                <div className="text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                        Not Enough Data Yet
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Add more expenses to generate AI-powered insights
                    </p>
                </div>
            </div>
        );
    }

    // Group signals by severity
    const highPriority = signals.filter((s) => s.severity === "HIGH");
    const mediumPriority = signals.filter((s) => s.severity === "MEDIUM");
    const lowPriority = signals.filter((s) => s.severity === "LOW");

    return (
        <div className="space-y-6">
            {/* Spending Pattern Chart */}
            {Object.keys(chartData).length > 0 && (
                <UnifiedSpendChart chartData={chartData} />
            )}

            {/* Summary Stats - Compact */}
            <div>
                <h2 className="text-lg font-bold mb-3 text-zinc-900 dark:text-white flex items-center gap-2">
                    <span>🔍</span>
                    <span>Intelligence Signals</span>
                </h2>
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {highPriority.length}
                        </div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">High Priority</div>
                    </div>
                    <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {mediumPriority.length}
                        </div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">Needs Attention</div>
                    </div>
                    <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {lowPriority.length}
                        </div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">Informational</div>
                    </div>
                </div>
            </div>

            {/* High Priority Alerts */}
            {highPriority.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white flex items-center gap-2">
                        <span>🚨</span>
                        <span>High Priority</span>
                    </h2>
                    <div className="flex flex-wrap gap-4">
                        {highPriority.map((signal, idx) => (
                            <div key={`high-${idx}`} className="flex-1 min-w-[300px] max-w-full lg:max-w-[calc(50%-0.5rem)]">
                                <InsightCard signal={signal} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Medium Priority */}
            {mediumPriority.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white flex items-center gap-2">
                        <span>⚠️</span>
                        <span>Needs Attention</span>
                    </h2>
                    <div className="flex flex-wrap gap-4">
                        {mediumPriority.map((signal, idx) => (
                            <div key={`medium-${idx}`} className="flex-1 min-w-[280px] max-w-full lg:max-w-[calc(33.333%-0.67rem)]">
                                <InsightCard signal={signal} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Low Priority */}
            {lowPriority.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white flex items-center gap-2">
                        <span>ℹ️</span>
                        <span>Informational</span>
                    </h2>
                    <div className="flex flex-wrap gap-4">
                        {lowPriority.map((signal, idx) => (
                            <div key={`low-${idx}`} className="flex-1 min-w-[280px] max-w-full md:max-w-[calc(50%-0.5rem)] lg:max-w-[calc(33.333%-0.67rem)]">
                                <InsightCard signal={signal} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
