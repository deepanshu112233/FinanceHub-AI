import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

export async function DELETE(request: NextRequest) {
    try {
        const user = await getOrCreateUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { ids } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: 'Invalid request: ids must be a non-empty array' },
                { status: 400 }
            );
        }

        // Delete income records that belong to the user
        const result = await prisma.income.deleteMany({
            where: {
                id: { in: ids },
                userId: user.id, // Ensure user owns these income records
            },
        });

        return NextResponse.json({
            success: true,
            deletedCount: result.count,
            message: `Successfully deleted ${result.count} income record(s)`,
        });
    } catch (error) {
        console.error('❌ Error deleting income:', error);
        return NextResponse.json(
            { error: 'Failed to delete income' },
            { status: 500 }
        );
    }
}
