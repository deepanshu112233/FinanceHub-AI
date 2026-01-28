"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useGroupData } from "@/contexts/GroupDataContext";

interface Activity {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    details: string | null;
    createdAt: string;
}

export function GroupActivityLog() {
    const { data, isLoading } = useGroupData();
    const activities = data?.activities || [];
    const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        if (filter === "all") {
            setFilteredActivities(activities);
        } else if (filter === "expenses") {
            setFilteredActivities(activities.filter(a => a.entityType === "expense"));
        } else if (filter === "settlements") {
            setFilteredActivities(activities.filter(a => a.entityType === "settlement"));
        } else if (filter === "members") {
            setFilteredActivities(activities.filter(a => a.entityType === "member"));
        }
    }, [filter, activities]);

    const formatTimestamp = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionBadge = (action: string, entityType: string) => {
        let color = "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
        let label = action.toUpperCase();

        if (action === "created") {
            color = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            if (entityType === "expense") label = "EXPENSE ADDED";
            if (entityType === "group") label = "GROUP CREATED";
            if (entityType === "member") label = "MEMBER ADDED";
        } else if (action === "updated") {
            color = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            label = "EDITED";
        } else if (action === "deleted") {
            color = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            label = "DELETED";
        } else if (action === "settled") {
            color = "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
            label = "SETTLED UP";
        }

        return { color, label };
    };

    if (isLoading) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-zinc-600 dark:text-zinc-400">📋</span>
                    <h3 className="font-semibold text-zinc-900 dark:text-white">Group Activity Log</h3>
                </div>
                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Activities</SelectItem>
                        <SelectItem value="expenses">Expenses Only</SelectItem>
                        <SelectItem value="settlements">Settlements Only</SelectItem>
                        <SelectItem value="members">Members Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {filteredActivities.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                    No activities to display
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase p-3">
                                    Timestamp
                                </th>
                                <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase p-3">
                                    Action
                                </th>
                                <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase p-3">
                                    Details
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {filteredActivities.map((activity) => {
                                const badge = getActionBadge(activity.action, activity.entityType);
                                return (
                                    <tr key={activity.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                                        <td className="p-3 text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                                            {formatTimestamp(activity.createdAt)}
                                        </td>
                                        <td className="p-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td className="p-3 text-sm text-zinc-600 dark:text-zinc-400">
                                            {activity.details || 'No details available'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
}
