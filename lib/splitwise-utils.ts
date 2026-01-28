import { prisma } from './db';

/**
 * Splitwise Balance Computation Utilities
 * 
 * Mathematical Formula:
 * balance(Member) = 
 *   (total paid by Member) 
 *   − (total expense share of Member)
 *   + (settlements received by Member)
 *   − (settlements paid by Member)
 */

interface MemberBalance {
    memberId: string;
    userId: string;
    userName: string;
    balance: number;
    totalPaid: number;
    totalOwed: number;
    settlementsReceived: number;
    settlementsPaid: number;
}

interface DebtRelationship {
    fromMemberId: string;
    fromMemberName: string;
    toMemberId: string;
    toMemberName: string;
    amount: number;
}

/**
 * Calculate balance for a single member in a group
 */
export async function calculateMemberBalance(memberId: string, groupId: string): Promise<number> {
    // 1. Total paid by member
    const expensesPaid = await prisma.groupExpense.aggregate({
        where: {
            groupId,
            paidByMemberId: memberId,
            status: 'ACTIVE',
        },
        _sum: {
            amount: true,
        },
    });
    const totalPaid = expensesPaid._sum?.amount ?? 0;

    // 2. Total owed by member (their share of all expenses)
    const expenseSplits = await prisma.expenseSplit.aggregate({
        where: {
            memberId,
            groupExpense: {
                is: {
                    groupId,
                    status: 'ACTIVE',
                },
            },
        },
        _sum: {
            amount: true,
        },
    });
    const totalOwed = expenseSplits._sum?.amount ?? 0;

    // 3. Settlements received by member
    const settlementsReceived = await prisma.groupSettlement.aggregate({
        where: {
            groupId,
            toMemberId: memberId,
        },
        _sum: {
            amount: true,
        },
    });
    const receivedAmount = settlementsReceived._sum?.amount ?? 0;

    // 4. Settlements paid by member
    const settlementsPaid = await prisma.groupSettlement.aggregate({
        where: {
            groupId,
            fromMemberId: memberId,
        },
        _sum: {
            amount: true,
        },
    });
    const paidAmount = settlementsPaid._sum?.amount ?? 0;

    // Calculate net balance
    const balance = totalPaid - totalOwed + receivedAmount - paidAmount;

    return balance;
}

/**
 * Calculate balances for all members in a group (OPTIMIZED)
 * Uses in-memory approach with single query for better performance
 */
export async function calculateGroupBalances(groupId: string): Promise<MemberBalance[]> {
    // Fetch all members
    const members = await prisma.groupMember.findMany({
        where: { groupId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    // Fetch all expenses with splits in single query
    const expenses = await prisma.groupExpense.findMany({
        where: {
            groupId,
            status: 'ACTIVE'
        },
        include: {
            splits: true
        },
    });

    // Fetch all settlements
    const settlements = await prisma.groupSettlement.findMany({
        where: { groupId },
    });

    // Build balance map in-memory
    const balanceMap: Record<string, {
        balance: number;
        totalPaid: number;
        totalOwed: number;
        settlementsReceived: number;
        settlementsPaid: number;
    }> = {};

    // Initialize all members with zero balance
    for (const member of members) {
        balanceMap[member.id] = {
            balance: 0,
            totalPaid: 0,
            totalOwed: 0,
            settlementsReceived: 0,
            settlementsPaid: 0,
        };
    }

    // Process expenses
    for (const expense of expenses) {
        // Payer gets full credit (+amount)
        if (balanceMap[expense.paidByMemberId]) {
            balanceMap[expense.paidByMemberId].totalPaid += expense.amount;
            balanceMap[expense.paidByMemberId].balance += expense.amount;
        }

        // Split members owe (-amount)
        for (const split of expense.splits) {
            if (balanceMap[split.memberId]) {
                balanceMap[split.memberId].totalOwed += split.amount;
                balanceMap[split.memberId].balance -= split.amount;
            }
        }
    }

    // Process settlements
    for (const settlement of settlements) {
        // Receiver gets credit
        if (balanceMap[settlement.toMemberId]) {
            balanceMap[settlement.toMemberId].settlementsReceived += settlement.amount;
            balanceMap[settlement.toMemberId].balance += settlement.amount;
        }

        // Payer gets debited
        if (balanceMap[settlement.fromMemberId]) {
            balanceMap[settlement.fromMemberId].settlementsPaid += settlement.amount;
            balanceMap[settlement.fromMemberId].balance -= settlement.amount;
        }
    }

    // Convert to array format
    const balances: MemberBalance[] = members.map(member => ({
        memberId: member.id,
        userId: member.userId,
        userName: member.user.name || 'Unknown',
        balance: balanceMap[member.id].balance,
        totalPaid: balanceMap[member.id].totalPaid,
        totalOwed: balanceMap[member.id].totalOwed,
        settlementsReceived: balanceMap[member.id].settlementsReceived,
        settlementsPaid: balanceMap[member.id].settlementsPaid,
    }));

    return balances;
}

/**
 * Get debt relationships (who owes whom)
 * Calculates based on expenses only, excluding settlements
 */
export async function getDebtTree(groupId: string): Promise<DebtRelationship[]> {
    // Fetch all members
    const members = await prisma.groupMember.findMany({
        where: { groupId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    // Fetch all expenses with splits (exclude settlements from balance calculation)
    const expenses = await prisma.groupExpense.findMany({
        where: {
            groupId,
            status: 'ACTIVE'
        },
        include: {
            splits: true
        },
    });

    // Fetch all settlements to subtract from raw balances
    const settlements = await prisma.groupSettlement.findMany({
        where: { groupId },
    });

    // Build balance map EXCLUDING settlements for debt tree calculation
    const balanceMap: Record<string, number> = {};

    // Initialize all members with zero balance
    for (const member of members) {
        balanceMap[member.id] = 0;
    }

    // Process expenses only
    for (const expense of expenses) {
        // Payer gets full credit (+amount)
        if (balanceMap[expense.paidByMemberId] !== undefined) {
            balanceMap[expense.paidByMemberId] += expense.amount;
        }

        // Split members owe (-amount)
        for (const split of expense.splits) {
            if (balanceMap[split.memberId] !== undefined) {
                balanceMap[split.memberId] -= split.amount;
            }
        }
    }

    // Subtract settlements to get remaining balances
    for (const settlement of settlements) {
        // Receiver gets credit reduced (they received payment)
        if (balanceMap[settlement.toMemberId] !== undefined) {
            balanceMap[settlement.toMemberId] -= settlement.amount;
        }

        // Payer gets debt reduced (they paid)
        if (balanceMap[settlement.fromMemberId] !== undefined) {
            balanceMap[settlement.fromMemberId] += settlement.amount;
        }
    }

    // Create member balance objects with names
    const balances = members.map(member => ({
        memberId: member.id,
        userName: member.user.name || 'Unknown',
        balance: balanceMap[member.id],
    }));

    const debts: DebtRelationship[] = [];
    const debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
    const creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);

    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        const debtAmount = Math.abs(debtor.balance);
        const creditAmount = creditor.balance;

        const settlementAmount = Math.min(debtAmount, creditAmount);

        debts.push({
            fromMemberId: debtor.memberId,
            fromMemberName: debtor.userName,
            toMemberId: creditor.memberId,
            toMemberName: creditor.userName,
            amount: settlementAmount,
        });

        debtor.balance += settlementAmount;
        creditor.balance -= settlementAmount;

        if (Math.abs(debtor.balance) < 0.01) i++;
        if (Math.abs(creditor.balance) < 0.01) j++;
    }

    return debts;
}

/**
 * Suggest optimal settlements to balance the group
 */
export async function suggestSettlements(groupId: string) {
    return await getDebtTree(groupId);
}

/**
 * Create a group expense with validation
 * Centralized expense creation utility
 */
export async function createGroupExpense({
    groupId,
    paidByMemberId,
    amount,
    category,
    splits,
    description,
    date,
}: {
    groupId: string;
    paidByMemberId: string;
    amount: number;
    category: string;
    splits: { memberId: string; amount: number }[];
    description?: string;
    date?: Date;
}) {
    // Validate split total
    const splitTotal = splits.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(splitTotal - amount) > 0.01) {
        throw new Error(`Split total ($${splitTotal.toFixed(2)}) must equal expense amount ($${amount.toFixed(2)})`);
    }

    // Validate payer is in group
    const payerMember = await prisma.groupMember.findUnique({
        where: { id: paidByMemberId },
    });

    if (!payerMember || payerMember.groupId !== groupId) {
        throw new Error('Invalid payer - not a member of this group');
    }

    // Create expense in transaction
    const expense = await prisma.groupExpense.create({
        data: {
            groupId,
            paidByMemberId,
            amount,
            category,
            description,
            date: date || new Date(),
            status: 'ACTIVE',
            splits: {
                create: splits.map(s => ({
                    memberId: s.memberId,
                    amount: s.amount,
                })),
            },
        },
        include: {
            splits: true,
        },
    });

    return expense;
}

/**
 * Generate optimal settlements from balance map
 * Uses greedy algorithm to minimize number of transactions
 */
export function generateSettlements(balances: Record<string, number>): {
    from: string;
    to: string;
    amount: number;
}[] {
    const creditors: { memberId: string; amount: number }[] = [];
    const debtors: { memberId: string; amount: number }[] = [];

    // Separate creditors and debtors
    for (const [memberId, balance] of Object.entries(balances)) {
        if (balance > 0.01) {
            creditors.push({ memberId, amount: balance });
        } else if (balance < -0.01) {
            debtors.push({ memberId, amount: -balance });
        }
    }

    // Sort for optimal matching
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const settlements: { from: string; to: string; amount: number }[] = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
        const payAmount = Math.min(debtors[i].amount, creditors[j].amount);

        if (payAmount > 0.01) {
            settlements.push({
                from: debtors[i].memberId,
                to: creditors[j].memberId,
                amount: payAmount,
            });
        }

        debtors[i].amount -= payAmount;
        creditors[j].amount -= payAmount;

        if (debtors[i].amount < 0.01) i++;
        if (creditors[j].amount < 0.01) j++;
    }

    return settlements;
}

/**
 * Save settlements to database
 */
export async function saveSettlements(
    groupId: string,
    settlements: { from: string; to: string; amount: number }[]
) {
    if (settlements.length === 0) {
        return [];
    }

    const created = await prisma.groupSettlement.createMany({
        data: settlements.map(s => ({
            groupId,
            fromMemberId: s.from,
            toMemberId: s.to,
            amount: s.amount,
        })),
    });

    return created;
}

/**
 * Calculate simple balance map (member ID => balance amount)
 * Useful for settlement generation
 */
export async function calculateBalanceMap(groupId: string): Promise<Record<string, number>> {
    const balances = await calculateGroupBalances(groupId);
    const balanceMap: Record<string, number> = {};

    for (const balance of balances) {
        balanceMap[balance.memberId] = balance.balance;
    }

    return balanceMap;
}

