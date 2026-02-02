"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { invalidateCache } from "@/lib/cache-utils";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeleteGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
    groupName: string;
}

const GROUPS_CACHE_KEY = "groups_data_cache";

export function DeleteGroupDialog({
    open,
    onOpenChange,
    groupId,
    groupName
}: DeleteGroupDialogProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");

    const handleDelete = async () => {
        setError("");
        setIsDeleting(true);

        try {
            const response = await fetch(`/api/groups/${groupId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                console.log('✅ Group deleted successfully');

                // Invalidate cache and dispatch event
                invalidateCache(GROUPS_CACHE_KEY);
                window.dispatchEvent(new CustomEvent('cache-invalidated'));

                onOpenChange(false);

                // Redirect to groups page
                router.push('/groups');
                router.refresh();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to delete group');
                setIsDeleting(false);
            }
        } catch (err) {
            console.error('Failed to delete group:', err);
            setError('Network error occurred');
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-950/20 rounded-full">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-white">
                            Delete Group
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-zinc-600 dark:text-zinc-400 pt-2">
                        Are you sure you want to delete <strong className="text-zinc-900 dark:text-white">{groupName}</strong>?
                        This action cannot be undone and will permanently delete:
                    </DialogDescription>
                </DialogHeader>

                <ul className="list-disc list-inside space-y-1 text-sm text-zinc-600 dark:text-zinc-400 py-2">
                    <li>All group expenses and transactions</li>
                    <li>All member balances and settlements</li>
                    <li>All group activity logs</li>
                    <li>All pending invitations</li>
                </ul>

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                <DialogFooter className="flex gap-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleDelete}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete Group'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
