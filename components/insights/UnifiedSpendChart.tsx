"use client";

import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceDot,
} from "recharts";
import { EWMAPoint } from "@/lib/signal/domain/Aggregates";

interface UnifiedSpendChartProps {
    chartData: Record<string, EWMAPoint[]>;
}

export function UnifiedSpendChart({ chartData }: UnifiedSpendChartProps) {
    if (!chartData || Object.keys(chartData).length === 0) {
        return (
            <div className="flex items-center justify-center h-[400px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                <p className="text-zinc-500 dark:text-zinc-400">No spending data available</p>
            </div>
        );
    }

    // Combine all categories into one time series (aggregate by date)
    const dateMap = new Map<string, { actual: number; ewma: number; anomalies: string[] }>();

    for (const [category, points] of Object.entries(chartData)) {
        for (const point of points) {
            const dateKey = point.date;
            if (!dateMap.has(dateKey)) {
                dateMap.set(dateKey, { actual: 0, ewma: 0, anomalies: [] });
            }

            const entry = dateMap.get(dateKey)!;
            entry.actual += point.actual;
            entry.ewma += point.ewma;

            if (point.isAnomaly) {
                entry.anomalies.push(category);
            }
        }
    }

    // Convert to array and sort by date
    const combinedData = Array.from(dateMap.entries())
        .map(([dateKey, data]) => ({
            date: new Date(dateKey).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            }),
            fullDate: dateKey,
            actual: Math.round(data.actual),
            ewma: Math.round(data.ewma),
            hasAnomaly: data.anomalies.length > 0,
            anomalyCategories: data.anomalies.join(", "),
        }))
        .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const difference = data.actual - data.ewma;
            const percentDiff = data.ewma > 0 ? ((difference / data.ewma) * 100).toFixed(1) : 0;

            return (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-lg">
                    <p className="font-semibold text-sm mb-2">{data.date}</p>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between gap-4">
                            <span className="text-blue-400">Actual Spending:</span>
                            <span className="font-semibold">${data.actual}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-blue-600 dark:text-blue-500">EWMA Signal:</span>
                            <span className="font-semibold">${data.ewma}</span>
                        </div>
                        <div className="flex justify-between gap-4 pt-1 border-t border-zinc-200 dark:border-zinc-700">
                            <span className="text-zinc-500">Variance:</span>
                            <span
                                className={`font-semibold ${difference > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                                    }`}
                            >
                                {difference > 0 ? "+" : ""}${difference} ({percentDiff}%)
                            </span>
                        </div>
                        {data.hasAnomaly && (
                            <div className="pt-1 border-t border-zinc-200 dark:border-zinc-700">
                                <span className="text-orange-600 dark:text-orange-400 font-semibold">
                                    🔸 Spike: {data.anomalyCategories}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <div className="mb-4">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                    Spending Stability & EWMA Signal
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Combined spending across all categories with exponential weighted moving average
                </p>
            </div>

            <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={combinedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#dbeafe" stopOpacity={0.3} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-zinc-700" opacity={0.5} />

                    <XAxis
                        dataKey="date"
                        tick={{ fill: "#6b7280", fontSize: 11 }}
                        stroke="#d1d5db"
                        axisLine={{ stroke: "#e5e7eb" }}
                    />

                    <YAxis
                        tick={{ fill: "#6b7280", fontSize: 11 }}
                        stroke="#d1d5db"
                        axisLine={{ stroke: "#e5e7eb" }}
                    />

                    <Tooltip content={<CustomTooltip />} />

                    <Legend
                        wrapperStyle={{ paddingTop: "10px" }}
                        iconType="circle"
                        formatter={(value) => (
                            <span className="text-xs text-zinc-600 dark:text-zinc-400">{value}</span>
                        )}
                    />

                    {/* Bars for actual spending - light blue/purple gradient */}
                    <Bar
                        dataKey="actual"
                        fill="url(#barGradient)"
                        name="Actual Spending"
                        radius={[4, 4, 0, 0]}
                        opacity={0.6}
                    />

                    {/* Smooth EWMA line - blue curve */}
                    <Line
                        type="monotone"
                        dataKey="ewma"
                        stroke="#2563eb"
                        strokeWidth={3}
                        name="EWMA Signal (α=0.3)"
                        dot={false}
                        activeDot={{ r: 5, fill: "#2563eb" }}
                    />

                    {/* Mark anomalies with dots */}
                    {combinedData.map((entry, index) => {
                        if (entry.hasAnomaly) {
                            return (
                                <ReferenceDot
                                    key={index}
                                    x={entry.date}
                                    y={entry.actual}
                                    r={6}
                                    fill="#f97316"
                                    stroke="#fff"
                                    strokeWidth={2}
                                />
                            );
                        }
                        return null;
                    })}
                </ComposedChart>
            </ResponsiveContainer>

            {/* Chart description */}
            <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 pt-3">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-blue-300 dark:bg-blue-400 opacity-60"></div>
                    <span>Daily spending bars</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-blue-600"></div>
                    <span>EWMA baseline trend</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-white"></div>
                    <span>Anomaly spike</span>
                </div>
            </div>
        </div>
    );
}
