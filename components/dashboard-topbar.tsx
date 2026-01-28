'use client';

import { usePathname } from 'next/navigation';
import { Topbar } from './topbar';
import { useDashboard } from './dashboard-context';

const routeTitles: Record<string, string> = {
    '/dashboard': 'Dashboard Overview',
    '/personal': 'Personal Tracking',
    '/groups': 'Group Splitting',
    '/transactions': 'All Transactions',
    '/insights': 'AI Insight Reports',
};

export function DashboardTopbar({ onActionButtonClick }: { onActionButtonClick?: (() => void) | undefined }) {
    const pathname = usePathname();
    const { isMobileMenuOpen, setIsMobileMenuOpen } = useDashboard();

    const title = routeTitles[pathname] || 'Dashboard';

    return (
        <Topbar
            title={title}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
    );
}
