"use client";

import { Card } from "@/components/ui/card";
import { Users, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface Group {
    id: string;
    name: string;
    description: string | null;
    memberCount: number;
    role: string;
}

interface UserGroupsListProps {
    groups: Group[];
}

export function UserGroupsList({ groups }: UserGroupsListProps) {
    const router = useRouter();

    if (groups.length === 0) {
        return (
            <Card className="p-6">
                <div className="space-y-4">
                    <h3 className="font-semibold text-zinc-900 dark:text-white">Your Groups</h3>
                    <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No groups yet</p>
                        <p className="text-sm">Create a group to split expenses with friends</p>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="space-y-4">
                <h3 className="font-semibold text-zinc-900 dark:text-white">
                    Your Groups ({groups.length})
                </h3>
                <div className="space-y-2">
                    {groups.map((group) => (
                        <button
                            key={group.id}
                            onClick={() => router.push(`/groups?selected=${group.id}`)}
                            className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-zinc-900 dark:text-white">
                                        {group.name}
                                        {group.role === 'admin' && (
                                            <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                                                Admin
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-zinc-400" />
                        </button>
                    ))}
                </div>
            </div>
        </Card>
    );
}
