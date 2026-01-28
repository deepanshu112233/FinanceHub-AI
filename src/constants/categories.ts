export const EXPENSE_CATEGORIES = [
    'Food',
    'Travel',
    'Groceries',
    'Rent_utilities',
    'Personal_utilities',
    'Other',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export const CATEGORY_COLORS: Record<string, string> = {
    Food: '#f97316', // orange
    Travel: '#3b82f6', // blue
    Groceries: '#a855f7', // purple
    Rent_utilities: '#22c55e', // green
    Personal_utilities: '#14b8a6', // teal
    Other: '#6b7280', // gray
};

export const CATEGORY_ICONS: Record<string, string> = {
    Food: '🍔',
    Travel: '✈️',
    Groceries: '🛒',
    Rent_utilities: '🏠',
    Personal_utilities: '💡',
    Other: '📦',
};
