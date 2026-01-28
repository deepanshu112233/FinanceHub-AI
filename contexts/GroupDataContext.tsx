"use client";

import { createContext, useContext, ReactNode } from 'react';
import useSWR, { mutate } from 'swr';

interface GroupMember {
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

interface GroupExpense {
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    status: string;
    paidBy: {
        id: string;
        user: {
            name: string;
        };
    };
    splits: Array<{
        id: string;
        amount: number;
        member: {
            id: string;
            user: {
                name: string;
            };
        };
    }>;
}

interface Activity {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    details: string;
    createdAt: string;
}

interface GroupSummaryData {
    groupId: string;
    totalSpend: number;
    userBalance: number;
    expenses: GroupExpense[];
    members: GroupMember[];
    activities: Activity[];
}

interface GroupDataContextValue {
    data: GroupSummaryData | undefined;
    isLoading: boolean;
    isError: boolean;
    mutate: (data?: any, opts?: any) => Promise<any>;
}

const GroupDataContext = createContext<GroupDataContextValue | null>(null);

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error('Failed to fetch data');
    }
    const json = await res.json();
    return json.data;
};

export function GroupDataProvider({
    children,
    groupId
}: {
    children: ReactNode;
    groupId: string;
}) {
    const { data, error, mutate: swrMutate } = useSWR<GroupSummaryData>(
        groupId ? `/api/groups/${groupId}/summary` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            dedupingInterval: 2000, // Prevent duplicate requests within 2 seconds
        }
    );

    const value: GroupDataContextValue = {
        data,
        isLoading: !error && !data,
        isError: !!error,
        mutate: async (data?: any, opts?: any) => {
            return await swrMutate(data, opts);
        },
    };

    return (
        <GroupDataContext.Provider value={value}>
            {children}
        </GroupDataContext.Provider>
    );
}

export function useGroupData() {
    const context = useContext(GroupDataContext);
    if (!context) {
        throw new Error('useGroupData must be used within GroupDataProvider');
    }
    return context;
}

// Helper function to manually trigger a refresh of group data
export function refreshGroupData(groupId: string) {
    mutate(`/api/groups/${groupId}/summary`);
}
