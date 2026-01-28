"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, CheckCircle2, TrendingUp } from "lucide-react";
import { useGroupData } from "@/contexts/GroupDataContext";

interface DebtRelationship {
    fromMemberId: string;
    fromMemberName: string;
    toMemberId: string;
    toMemberName: string;
    amount: number;
}

interface SettleUpDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
}

export function SettleUpDialog({ open, onOpenChange, groupId }: SettleUpDialogProps) {
    const { mutate } = useGroupData();
    const [debtTree, setDebtTree] = useState<DebtRelationship[]>([]);
    const [settledRelationships, setSettledRelationships] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [isSettling, setIsSettling] = useState<Record<string, boolean>>({});
    const [currentMemberId, setCurrentMemberId] = useState<string>("");

    // Fetch debt tree when dialog opens
    useEffect(() => {
        if (open) {
            fetchDebtTree();
        } else {
            // Reset state when dialog closes
            setSettledRelationships(new Set());
            setIsSettling({});
        }
    }, [open, groupId]);

    const fetchDebtTree = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/groups/${groupId}/debt-tree`);
            if (response.ok) {
                const data = await response.json();
                setDebtTree(data.debtTree || []);
                setCurrentMemberId(data.currentMemberId || "");
            } else {
                console.error('Failed to fetch debt tree');
            }
        } catch (error) {
            console.error('Error fetching debt tree:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSettle = async (relationship: DebtRelationship) => {
        const key = `${relationship.fromMemberId}-${relationship.toMemberId}`;

        try {
            setIsSettling(prev => ({ ...prev, [key]: true }));

            const response = await fetch(`/api/groups/${groupId}/settlements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fromMemberId: relationship.fromMemberId,
                    toMemberId: relationship.toMemberId,
                    amount: relationship.amount,
                }),
            });

            if (response.ok) {
                // Mark as settled locally
                setSettledRelationships(prev => new Set(prev).add(key));

                console.log('💳 Settlement recorded in database, refreshing UI...');

                // Wait for DB to finalize the transaction and clear any caches
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Force refresh group data - this will refetch from the API
                console.log('🔄 Calling mutate to refresh group data...');
                await mutate(undefined, { revalidate: true });

                // Additional delay to let SWR update
                await new Promise(resolve => setTimeout(resolve, 500));

                // Refresh debt tree with updated balances
                console.log('🔄 Refreshing debt tree...');
                await fetchDebtTree();

                console.log('✅ Settlement recorded and balances updated');
            } else {
                const error = await response.json();
                alert(`Failed to record settlement: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error recording settlement:', error);
            alert('Failed to record settlement. Please try again.');
        } finally {
            setIsSettling(prev => ({ ...prev, [key]: false }));
        }
    };

    // Get initials for avatar
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const allSettled = debtTree.length === 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Settle Up
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : allSettled ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🎉</div>
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                            All Settled!
                        </h3>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Everyone is balanced. No settlements needed.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Optimal settlement plan to balance all debts:
                        </p>

                        <div className="space-y-3">
                            {debtTree.map((relationship, index) => {
                                const key = `${relationship.fromMemberId}-${relationship.toMemberId}`;
                                const isSettled = settledRelationships.has(key);
                                const isCurrentUserPayer = relationship.fromMemberId === currentMemberId;
                                const settling = isSettling[key] || false;

                                return (
                                    <div
                                        key={key}
                                        className={`p-4 rounded-lg border transition-all ${isSettled
                                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                            : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                {/* From Member */}
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-semibold text-sm">
                                                        {getInitials(relationship.fromMemberName)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-zinc-900 dark:text-white text-sm">
                                                            {relationship.fromMemberName}
                                                        </p>
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                            Pays ${relationship.amount.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Arrow */}
                                                <ArrowRight className="w-5 h-5 text-zinc-400 flex-shrink-0" />

                                                {/* To Member */}
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold text-sm">
                                                        {getInitials(relationship.toMemberName)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-zinc-900 dark:text-white text-sm">
                                                            {relationship.toMemberName}
                                                        </p>
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                            Receives ${relationship.amount.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div className="ml-4">
                                                {isSettled ? (
                                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                        <span className="text-sm font-medium">Settled</span>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleSettle(relationship)}
                                                        disabled={settling || !isCurrentUserPayer}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                                    >
                                                        {settling ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                                Recording...
                                                            </>
                                                        ) : (
                                                            'Done'
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {!isSettled && !isCurrentUserPayer && (
                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                                                Only the payer can mark this as settled
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
