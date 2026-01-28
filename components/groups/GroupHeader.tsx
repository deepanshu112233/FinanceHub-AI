"use client";

import { Search, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface GroupHeaderProps {
    onToggleSidebar: () => void;
}

export function GroupHeader({ onToggleSidebar }: GroupHeaderProps) {
    return (
        <header className="sticky top-0 z-20 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4">
                {/* Left: Title */}
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                        Group Splitting
                    </h1>
                </div>

                {/* Right: Search, Create Button, Menu */}
                <div className="flex items-center gap-3">
                    {/* Search bar - hidden on mobile */}
                    <div className="hidden md:flex items-center relative">
                        <Search className="absolute left-3 w-4 h-4 text-zinc-400" />
                        <Input
                            type="search"
                            placeholder="Search groups or transactions..."
                            className="pl-10 w-64 bg-zinc-50 dark:bg-zinc-900"
                        />
                    </div>

                    {/* Create New Group Button */}
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Create New Group</span>
                        <span className="sm:hidden">New</span>
                    </Button>

                    {/* Mobile menu toggle for groups sidebar */}
                    <button
                        onClick={onToggleSidebar}
                        className="lg:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    >
                        <Menu className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                    </button>
                </div>
            </div>
        </header>
    );
}
