"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useGroupData } from "@/contexts/GroupDataContext";
import { SettleUpDialog } from "@/components/groups/SettleUpDialog";

interface Member {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: string;
    status: string;
    userStatus: string;
    balance: number;
    joinedAt: string;
}

export function IndividualBalances() {
    const { data, isLoading } = useGroupData();
    const members = data?.members || [];
    const groupId = data?.groupId || "";
    const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);

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
                <h3 className="font-semibold text-zinc-900 dark:text-white">
                    Individual Balances ({members.length} {members.length === 1 ? 'member' : 'members'})
                </h3>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsSettleUpOpen(true)}
                    className="text-sm"
                >
                    Settle Up
                </Button>
            </div>

            {members.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                    No members in this group yet
                </div>
            ) : (
                <div className="space-y-3">
                    {members.map((member) => {
                        const isPending = member.status === 'PENDING';
                        const isOwed = member.balance < 0; // User owes this member
                        const isOwing = member.balance > 0; // This member owes user
                        const isSettled = member.balance === 0;

                        // Get initials for avatar
                        const initials = member.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2);

                        return (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div className={`w-10 h-10 rounded-full ${isPending ? 'bg-zinc-400' : 'bg-blue-600'} text-white flex items-center justify-center font-semibold`}>
                                        {initials}
                                    </div>

                                    {/* Name and Balance */}
                                    <div>
                                        <p className="font-medium text-zinc-900 dark:text-white">
                                            {member.name}
                                            {member.role === 'admin' && (
                                                <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                                                    Admin
                                                </span>
                                            )}
                                            {isPending && (
                                                <span className="ml-2 text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">
                                                    Pending
                                                </span>
                                            )}
                                        </p>
                                        {!isSettled ? (
                                            <p
                                                className={`text-sm ${isOwed
                                                    ? "text-red-600 dark:text-red-400"
                                                    : "text-green-600 dark:text-green-400"
                                                    }`}
                                            >
                                                {isOwed ? "You owe" : "Owes overall"} $
                                                {Math.abs(member.balance).toFixed(2)}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                                Settled up
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Action Button */}
                                {!isPending && isOwed && (
                                    <Button
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        Pay {member.name.split(' ')[0]}
                                    </Button>
                                )}
                                {!isPending && isOwing && (
                                    <Button size="sm" variant="outline">
                                        Remind
                                    </Button>
                                )}
                                {!isPending && isSettled && (
                                    <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                                        Settled
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Settle Up Dialog */}
            <SettleUpDialog
                open={isSettleUpOpen}
                onOpenChange={setIsSettleUpOpen}
                groupId={groupId}
            />
        </Card>
    );
}
