"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invalidateCache } from "@/lib/cache-utils";
import { Loader2 } from "lucide-react";

interface EditGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
    currentName: string;
    currentDescription?: string;
}

const GROUPS_CACHE_KEY = "groups_data_cache";

export function EditGroupDialog({
    open,
    onOpenChange,
    groupId,
    currentName,
    currentDescription
}: EditGroupDialogProps) {
    const [name, setName] = useState(currentName);
    const [description, setDescription] = useState(currentDescription || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/groups/${groupId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description }),
            });

            if (response.ok) {
                console.log('✅ Group updated successfully');

                // Invalidate cache and dispatch event
                invalidateCache(GROUPS_CACHE_KEY);
                window.dispatchEvent(new CustomEvent('cache-invalidated'));

                onOpenChange(false);

                // Reset form
                setName(currentName);
                setDescription(currentDescription || "");
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to update group');
            }
        } catch (err) {
            console.error('Failed to update group:', err);
            setError('Network error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-white">
                        Edit Group
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="group-name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Group Name
                        </Label>
                        <Input
                            id="group-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Housemates, Trip to Bali..."
                            required
                            className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="group-description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Description (Optional)
                        </Label>
                        <Input
                            id="group-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this group for?"
                            className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700"
                            disabled={isSubmitting}
                        />
                    </div>

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
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={isSubmitting || !name.trim()}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
