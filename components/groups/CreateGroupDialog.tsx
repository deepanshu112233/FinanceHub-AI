"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mutate } from "swr";
import { invalidateCache } from "@/lib/cache-utils";

interface CreateGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const GROUPS_CACHE_KEY = "groups_data_cache";

export function CreateGroupDialog({ open, onOpenChange, onSuccess }: CreateGroupDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description }),
            });

            if (response.ok) {
                console.log('✅ Group created successfully, refreshing groups list...');

                // Invalidate custom cache used by groups page
                invalidateCache(GROUPS_CACHE_KEY);

                // Force refresh of groups list by invalidating SWR cache
                await mutate('/api/groups');

                // Small delay to ensure cache is updated
                await new Promise(resolve => setTimeout(resolve, 500));

                setName("");
                setDescription("");
                onOpenChange(false);
                if (onSuccess) onSuccess();

                console.log('🔄 Groups list refreshed');
            } else {
                const data = await response.json();
                alert(`Failed to create group: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to create group:', error);
            alert('Network error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-white">
                        Create New Group
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
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={isSubmitting || !name}
                        >
                            {isSubmitting ? "Creating..." : "Create Group"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
