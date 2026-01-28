"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ChartData {
    month: string;
    amount: number;
}

interface MonthlyExpenseChartProps {
    data: ChartData[];
}

type TimeRange = "3M" | "6M" | "1Y" | "3Y";

export function MonthlyExpenseChart({ data }: MonthlyExpenseChartProps) {
    const [selectedRange, setSelectedRange] = useState<TimeRange>("6M");

    const timeRanges: TimeRange[] = ["3M", "6M", "1Y", "3Y"];

    // Filter data based on selected range
    const getFilteredData = () => {
        const rangeMap = {
            "3M": 3,
            "6M": 6,
            "1Y": 12,
            "3Y": 36,
        };
        const monthsToShow = rangeMap[selectedRange];
        return data.slice(-monthsToShow);
    };

    const filteredData = getFilteredData();

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-3">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {payload[0].payload.month}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        ₹ {payload[0].value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
            {/* Header with Time Range Tabs */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                    Month-wise Total Expenses
                </h2>
                <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg">
                    {timeRanges.map((range) => (
                        <button
                            key={range}
                            onClick={() => setSelectedRange(range)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${selectedRange === range
                                ? "bg-blue-600 text-white shadow-md"
                                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={300}>
                <BarChart
                    data={filteredData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="month"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fill: "#71717a", fontSize: 12 }}
                    />
                    <YAxis
                        tick={{ fill: "#71717a", fontSize: 12 }}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                    <Bar
                        dataKey="amount"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={60}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
