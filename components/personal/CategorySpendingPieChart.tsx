"use client";

import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CategorySpendingPieChartProps {
    spendingByCategory: Record<string, { total: number; count: number }>;
    selectedMonth: string; // Format: "YYYY-MM"
}

const CATEGORY_COLORS: Record<string, string> = {
    "Food": "#f97316", // orange
    "Travel": "#3b82f6", // blue
    "Groceries": "#a855f7", // purple
    "Rent_utilities": "#22c55e", // green
    "Personal_utilities": "#14b8a6", // teal
    "Other": "#6b7280", // gray
};

export function CategorySpendingPieChart({ spendingByCategory, selectedMonth }: CategorySpendingPieChartProps) {
    // Format the selected month for display
    const formatMonth = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const displayMonth = formatMonth(selectedMonth);
    // Prepare data for pie chart
    const chartData = Object.entries(spendingByCategory)
        .filter(([_, data]) => data.total > 0)
        .map(([category, data]) => ({
            name: category,
            value: data.total,
            color: CATEGORY_COLORS[category] || CATEGORY_COLORS["Other"],
        }));

    const totalSpent = chartData.reduce((sum, item) => sum + item.value, 0);

    // Custom label for the pie chart
    const renderCustomLabel = ({
        cx,
        cy,
        midAngle,
        innerRadius,
        outerRadius,
        percent,
    }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

        if (percent < 0.05) return null; // Don't show labels for very small slices

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? "start" : "end"}
                dominantBaseline="central"
                className="text-xs font-semibold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    if (chartData.length === 0) {
        return (
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-6">{displayMonth} Expenses</h3>
                <div className="flex items-center justify-center h-64 text-zinc-400">
                    <p>No expenses recorded for {displayMonth}</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">{displayMonth} Expenses</h3>
                <div className="text-right">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">TOTAL</p>
                    <p className="text-xl font-bold">${totalSpent.toFixed(2)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomLabel}
                                outerRadius={140}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number | undefined) => value !== undefined ? `$${value.toFixed(2)}` : '$0.00'}
                                contentStyle={{
                                    backgroundColor: "#1f2937",
                                    border: "1px solid #374151",
                                    borderRadius: "8px",
                                    padding: "8px 12px",
                                }}
                                labelStyle={{
                                    color: "#ffffff",
                                    fontWeight: "600",
                                }}
                                itemStyle={{
                                    color: "#d1d5db",
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Expense List */}
                <div className="space-y-3">
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">BREAKDOWN</p>
                    {chartData
                        .sort((a, b) => b.value - a.value)
                        .map((item) => {
                            const percentage = ((item.value / totalSpent) * 100).toFixed(1);
                            return (
                                <div
                                    key={item.name}
                                    className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-zinc-900 dark:text-white">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                {percentage}% of total
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-bold">${item.value.toFixed(2)}</p>
                                </div>
                            );
                        })}
                </div>
            </div>
        </Card>
    );
}
