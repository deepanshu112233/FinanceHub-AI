export default function DashboardPage() {
    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Financial Snapshot</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Placeholder cards - will be replaced with actual data */}
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Total Balance</p>
                    <p className="text-2xl font-bold">$12,450.80</p>
                    <p className="text-xs text-green-600 mt-1">↑ +2.4% from last month</p>
                </div>
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Total Spending</p>
                    <p className="text-2xl font-bold">$3,120.00</p>
                    <p className="text-xs text-red-600 mt-1">↑ 12% over budget</p>
                </div>
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Total Income</p>
                    <p className="text-2xl font-bold">$5,050.15</p>
                    <p className="text-xs text-green-600 mt-1">↑ Steady vs last month</p>
                </div>
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Group Balances</p>
                    <p className="text-2xl font-bold">$845.20</p>
                    <p className="text-xs text-blue-600 mt-1">● 4 active shared groups</p>
                </div>
            </div>
        </div>
    );
}
