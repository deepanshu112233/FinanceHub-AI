"use client";

import { Card } from "@/components/ui/card";
import { AlertCircle, Info, TrendingUp } from "lucide-react";

interface Alert {
    type: 'warning' | 'info';
    message: string;
    category: string;
}

interface AlertsCardProps {
    alerts: Alert[];
}

export function AlertsCard({ alerts }: AlertsCardProps) {
    if (alerts.length === 0) {
        return (
            <Card className="p-6">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Alerts</p>
                    <div className="flex items-center gap-2 text-green-600">
                        <TrendingUp className="w-5 h-5" />
                        <p className="text-sm">All good! No alerts</p>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Alerts ({alerts.length})
                </p>
                <div className="space-y-2">
                    {alerts.slice(0, 3).map((alert, index) => (
                        <div
                            key={index}
                            className={`flex items-start gap-2 p-2 rounded-lg ${alert.type === 'warning'
                                    ? 'bg-amber-50 dark:bg-amber-950/20'
                                    : 'bg-blue-50 dark:bg-blue-950/20'
                                }`}
                        >
                            {alert.type === 'warning' ? (
                                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                            ) : (
                                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            )}
                            <p className={`text-sm ${alert.type === 'warning'
                                    ? 'text-amber-700 dark:text-amber-300'
                                    : 'text-blue-700 dark:text-blue-300'
                                }`}>
                                {alert.message}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}
