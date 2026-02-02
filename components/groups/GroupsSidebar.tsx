"use client";

import { useState } from "react";
import { X, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditGroupDialog } from "@/components/groups/EditGroupDialog";
import { DeleteGroupDialog } from "@/components/groups/DeleteGroupDialog";

interface Group {
    id: string;
    name: string;
    icon: string;
    balance: number;
    activeMembers: number;
    role: string; // Added role to check if user is admin
    description?: string;
}

interface GroupsSidebarProps {
    groups: Group[];
    selectedGroupId: string | null;
    onGroupSelect: (groupId: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

export function GroupsSidebar({
    groups,
    selectedGroupId,
    onGroupSelect,
    isOpen,
    onClose,
}: GroupsSidebarProps) {
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

    const handleEditClick = (e: React.MouseEvent, group: Group) => {
        e.stopPropagation();
        setSelectedGroup(group);
        setEditDialogOpen(true);
    };

    const handleDeleteClick = (e: React.MouseEvent, group: Group) => {
        e.stopPropagation();
        setSelectedGroup(group);
        setDeleteDialogOpen(true);
    };

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-20"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed right-0 top-0 z-20 h-screen w-80 bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 transition-transform duration-300 lg:relative lg:translate-x-0",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between lg:justify-center">
                        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                            Active Groups
                        </h2>
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Groups List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {groups.map((group) => {
                            const isSelected = group.id === selectedGroupId;
                            const isOwed = group.balance < 0;
                            const isOwing = group.balance > 0;
                            const isAdmin = group.role === 'admin';

                            return (
                                <div key={group.id} className="relative group/item">
                                    <button
                                        onClick={() => {
                                            onGroupSelect(group.id);
                                            onClose();
                                        }}
                                        className={cn(
                                            "w-full p-4 rounded-lg text-left transition-colors",
                                            isSelected
                                                ? "bg-blue-50 dark:bg-blue-950 border-2 border-blue-500"
                                                : "bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Icon */}
                                            <div className="text-2xl">{group.icon}</div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-zinc-900 dark:text-white truncate">
                                                    {group.name}
                                                </h3>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                    {group.activeMembers} member{group.activeMembers !== 1 && 's'}
                                                </p>
                                                {group.balance !== 0 && (
                                                    <p
                                                        className={cn(
                                                            "text-sm font-medium mt-1",
                                                            isOwed && "text-red-600 dark:text-red-400",
                                                            isOwing && "text-green-600 dark:text-green-400"
                                                        )}
                                                    >
                                                        {isOwed ? "You owe" : "You are owed"} $
                                                        {Math.abs(group.balance).toFixed(2)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </button>

                                    {/* Edit and Delete Icons (only for admins) */}
                                    {isAdmin && (
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleEditClick(e, group)}
                                                className="p-1.5 bg-white dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950 border border-zinc-200 dark:border-zinc-700 rounded-md transition-colors"
                                                title="Edit group"
                                            >
                                                <Pencil className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteClick(e, group)}
                                                className="p-1.5 bg-white dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950 border border-zinc-200 dark:border-zinc-700 rounded-md transition-colors"
                                                title="Delete group"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </aside>

            {/* Edit Group Dialog */}
            {selectedGroup && (
                <EditGroupDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    groupId={selectedGroup.id}
                    currentName={selectedGroup.name}
                    currentDescription={selectedGroup.description}
                />
            )}

            {/* Delete Group Dialog */}
            {selectedGroup && (
                <DeleteGroupDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    groupId={selectedGroup.id}
                    groupName={selectedGroup.name}
                />
            )}
        </>
    );
}
