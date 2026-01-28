'use client';

import { createContext, useContext } from 'react';

interface DashboardContextType {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (!context) {
        return {
            isMobileMenuOpen: false,
            setIsMobileMenuOpen: () => { },
        };
    }
    return context;
}

export const DashboardProvider = DashboardContext.Provider;
