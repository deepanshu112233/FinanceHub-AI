import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Get invite details by token
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        const invite = await prisma.groupInvite.findUnique({
            where: { token },
            include: {
                group: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
                invitedBy: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!invite) {
            return NextResponse.json(
                { error: 'Invitation not found' },
                { status: 404 }
            );
        }

        // Check if expired
        if (new Date() > invite.expiresAt) {
            // Update status if not already marked
            if (invite.status === 'INVITED') {
                await prisma.groupInvite.update({
                    where: { id: invite.id },
                    data: { status: 'EXPIRED' },
                });
            }

            return NextResponse.json(
                { error: 'This invitation has expired' },
                { status: 410 }
            );
        }

        // Check if already accepted
        if (invite.status === 'ACCEPTED') {
            return NextResponse.json(
                { error: 'This invitation has already been accepted' },
                { status: 400 }
            );
        }

        // Check if revoked
        if (invite.status === 'REVOKED') {
            return NextResponse.json(
                { error: 'This invitation has been revoked' },
                { status: 400 }
            );
        }

        return NextResponse.json({ invite });
    } catch (error) {
        console.error('❌ Error fetching invitation:', error);
        return NextResponse.json(
            { error: 'Failed to fetch invitation' },
            { status: 500 }
        );
    }
}
