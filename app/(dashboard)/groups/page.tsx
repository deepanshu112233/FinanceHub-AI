"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GroupDataProvider } from "@/contexts/GroupDataContext";
import { GroupsSidebar } from "@/components/groups/GroupsSidebar";
import { GroupTotalSpend } from "@/components/groups/GroupTotalSpend";
import { IndividualBalances } from "@/components/groups/IndividualBalances";
import { GroupTransactions } from "@/components/groups/GroupTransactions";
import { GroupActivityLog } from "@/components/groups/GroupActivityLog";
import { AIDebtInsight } from "@/components/groups/AIDebtInsight";
import { AddExpenseDialog } from "@/components/groups/AddExpenseDialog";
import { Menu, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCachedData, setCachedData, invalidateCache } from "@/lib/cache-utils";

type TabType = "info" | "logs";

interface Group {
    id: string;
    name: string;
    description?: string;
    memberCount: number;
    balance: number;
    role: string;
    createdAt: string;
}

// Cache configuration
const GROUPS_CACHE_KEY = "groups_data_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default function GroupsPage() {
    const router = useRouter();
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("info");
    const [isLoading, setIsLoading] = useState(false);
    const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Fetch groups from API with caching
    const fetchGroups = useCallback(async (forceRefresh = false) => {
        try {
            // Check cache first (skip if force refresh)
            if (!forceRefresh) {
                const cachedGroups = getCachedData<Group[]>(GROUPS_CACHE_KEY);
                if (cachedGroups) {
                    console.log("✅ Using cached groups data");
                    setGroups(cachedGroups);

                    // Auto-select first group if none selected
                    if (!selectedGroupId && cachedGroups.length > 0) {
                        setSelectedGroupId(cachedGroups[0].id);
                    }
                    return;
                }
            }

            // Fetch fresh data
            setIsLoading(true);
            console.log("🔄 Fetching fresh groups data from API");
            const response = await fetch('/api/groups');
            if (response.ok) {
                const data = await response.json();
                const fetchedGroups = data.groups || [];
                setGroups(fetchedGroups);

                // Cache the data
                setCachedData(GROUPS_CACHE_KEY, fetchedGroups, CACHE_TTL);

                // Auto-select first group if none selected
                if (!selectedGroupId && fetchedGroups.length > 0) {
                    setSelectedGroupId(fetchedGroups[0].id);
                }

                console.log(`Successfully fetched ${fetchedGroups.length} groups`);
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error(`Failed to fetch groups - Status: ${response.status}`, errorData);
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedGroupId]);

    // Fetch groups on mount (use cache for performance)
    useEffect(() => {
        fetchGroups(); // Use cache if available
    }, []);

    // Listen for cache invalidation events
    useEffect(() => {
        const handleCacheInvalidation = () => {
            console.log("🔄 Cache invalidated, refreshing groups...");
            invalidateCache(GROUPS_CACHE_KEY);
            fetchGroups(true); // Force refresh
        };

        window.addEventListener('cache-invalidated', handleCacheInvalidation);
        return () => window.removeEventListener('cache-invalidated', handleCacheInvalidation);
    }, [fetchGroups]);

    // Function to trigger refresh of all data
    const handleDataRefresh = () => {
        invalidateCache(GROUPS_CACHE_KEY);
        fetchGroups(true);
    };

    // Transform groups for sidebar
    const sidebarGroups = groups.map(group => ({
        id: group.id,
        name: group.name,
        icon: '👥', // Default icon, you can enhance this later
        balance: group.balance,
        activeMembers: group.memberCount,
        role: group.role,
        description: group.description,
    }));

    // Find selected group
    const selectedGroup = groups.find(g => g.id === selectedGroupId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-zinc-50 dark:bg-black">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (groups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-zinc-50 dark:bg-black">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                        No Groups Yet
                    </h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                        Create your first group to start splitting expenses
                    </p>
                    <button
                        onClick={() => router.push('/groups/create')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                    >
                        Create Group
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full overflow-hidden bg-zinc-50 dark:bg-black">
            {/* Main Content */}
            {selectedGroupId && (
                <GroupDataProvider groupId={selectedGroupId}>
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Group Info Card */}
                        <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-6">
                                    <span className="text-4xl">👥</span>
                                    <div className="flex items-center gap-8">
                                        <div>
                                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{selectedGroup?.name || 'Select a Group'}</h2>
                                            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                                                {selectedGroup && `${selectedGroup.memberCount} Member${selectedGroup.memberCount !== 1 ? 's' : ''}`}
                                            </p>
                                        </div>
                                        {/* Total Group Spend inline */}
                                        <GroupTotalSpend />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setIsAddExpenseDialogOpen(true)}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
                                    >
                                        Add Expense
                                    </button>
                                    {/* Mobile menu toggle */}
                                    <button
                                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                        className="lg:hidden p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white"
                                    >
                                        <Menu className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Tab Navigation */}
                            <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800">
                                <button
                                    onClick={() => setActiveTab("info")}
                                    className={cn(
                                        "pb-3 px-2 font-medium transition-colors relative",
                                        activeTab === "info"
                                            ? "text-blue-600 dark:text-blue-400"
                                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                                    )}
                                >
                                    Info
                                    {activeTab === "info" && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab("logs")}
                                    className={cn(
                                        "pb-3 px-2 font-medium transition-colors relative",
                                        activeTab === "logs"
                                            ? "text-blue-600 dark:text-blue-400"
                                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                                    )}
                                >
                                    Logs
                                    {activeTab === "logs" && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                            {/* Info Tab Content */}
                            {activeTab === "info" && (
                                <>
                                    {/* AI Debt Insight - Expanded */}
                                    <AIDebtInsight />

                                    {/* Individual Balances */}
                                    <IndividualBalances />

                                    {/* Recent Transactions - Full Width Table at Bottom */}
                                    <GroupTransactions />
                                </>
                            )}

                            {/* Logs Tab Content */}
                            {activeTab === "logs" && (
                                <div className="max-w-6xl">
                                    <GroupActivityLog />
                                </div>
                            )}
                        </main>
                    </div>

                    {/* Add Expense Dialog */}
                    <AddExpenseDialog
                        open={isAddExpenseDialogOpen}
                        onOpenChange={setIsAddExpenseDialogOpen}
                        groupId={selectedGroupId}
                    />
                </GroupDataProvider>
            )}

            {/* Groups Sidebar - Right side */}
            <GroupsSidebar
                groups={sidebarGroups}
                selectedGroupId={selectedGroupId}
                onGroupSelect={setSelectedGroupId}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
        </div>
    );
}
