'use client';

import { Search, Plus, Menu } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePathname, useRouter } from 'next/navigation';

interface TopbarProps {
    title: string;
    showAddButton?: boolean;
    onAddClick?: () => void;
    isMobileMenuOpen?: boolean;
    setIsMobileMenuOpen?: (open: boolean) => void;
    onActionButtonClick?: () => void;
}

export function Topbar({
    title,
    showAddButton = true,
    onAddClick,
    isMobileMenuOpen = false,
    setIsMobileMenuOpen,
    onActionButtonClick
}: TopbarProps) {
    const pathname = usePathname();
    const router = useRouter();

    // Determine button text based on route
    const getButtonText = () => {
        if (pathname === '/groups') return 'Create Group';
        if (pathname === '/personal') return 'Add Entry';
        if (pathname === '/transactions') return 'Add Transaction';
        return 'Add New Entry';
    };

    const handleButtonClick = () => {
        // Special handling for /groups route - navigate to create page
        if (pathname === '/groups') {
            router.push('/groups/create');
        } else if (onActionButtonClick) {
            onActionButtonClick();
        } else if (onAddClick) {
            onAddClick();
        }
    };

    return (
        <header className="sticky top-0 z-30 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4">
                {/* Mobile menu button + Title */}
                <div className="flex items-center gap-3">
                    {setIsMobileMenuOpen && (
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                        >
                            <Menu className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                        </button>
                    )}
                    <h1 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
                        {title}
                    </h1>
                </div>

                {/* Right side actions */}
                <div className="flex items-center gap-4">
                    {/* Create Group button - only show on groups page */}
                    {pathname === '/groups' && showAddButton && (
                        <Button
                            onClick={handleButtonClick}
                            className="bg-slate-800 hover:bg-slate-900 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">{getButtonText()}</span>
                            <span className="sm:hidden">Add</span>
                        </Button>
                    )}

                    {/* User profile button */}
                    <div suppressHydrationWarning>
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: "w-9 h-9"
                                }
                            }}
                            afterSignOutUrl="/"
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}
