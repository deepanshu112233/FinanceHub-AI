'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    User,
    Users,
    Receipt,
    LineChart,
    Menu,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Personal Tracking',
        href: '/personal',
        icon: User,
    },
    {
        title: 'Group Splitting',
        href: '/groups',
        icon: Users,
    },
    {
        title: 'All Transactions',
        href: '/transactions',
        icon: Receipt,
    },
    {
        title: 'AI Insight Reports',
        href: '/insights',
        icon: LineChart,
    },
];

interface SidebarProps {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
}

export function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-0 z-20 h-screen w-64 bg-[#1e293b] border-r border-slate-700 transition-transform duration-300',
                    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo/Header */}
                    <div className="p-6 border-b border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Receipt className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    QuantEx
                                </h2>
                                <p className="text-xs text-slate-400 uppercase tracking-wider">
                                    Intelligence
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation items */}
                    <nav className="flex-1 p-4 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                                        isActive
                                            ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-600/50'
                                            : 'text-slate-400 hover:text-white'
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-sm font-medium">{item.title}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-700">
                        <div className="px-4 py-2 text-xs text-slate-500">
                            © 2026 QuantEx Intelligence
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
