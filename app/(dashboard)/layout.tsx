'use client';

import { Sidebar } from '@/components/sidebar';
import { DashboardProvider } from '@/components/dashboard-context';
import { DashboardTopbar } from '@/components/dashboard-topbar';
import { useState, createContext, useContext } from 'react';

const ActionButtonContext = createContext<{ onActionButtonClick?: () => void }>({});

export function useActionButton() {
    return useContext(ActionButtonContext);
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [actionButtonHandler, setActionButtonHandler] = useState<(() => void) | undefined>();

    return (
        <DashboardProvider value={{ isMobileMenuOpen, setIsMobileMenuOpen }}>
            <ActionButtonContext.Provider value={{ onActionButtonClick: actionButtonHandler }}>
                <div className="min-h-screen bg-zinc-50 dark:bg-black">
                    <Sidebar
                        isMobileMenuOpen={isMobileMenuOpen}
                        setIsMobileMenuOpen={setIsMobileMenuOpen}
                    />
                    <div className="lg:pl-64">
                        <DashboardTopbar onActionButtonClick={actionButtonHandler} />
                        <main className="min-h-screen">
                            {children}
                        </main>
                    </div>
                </div>
            </ActionButtonContext.Provider>
        </DashboardProvider>
    );
}

export function setActionButtonHandler(handler?: () => void) {
    // This will be used by page components
}
