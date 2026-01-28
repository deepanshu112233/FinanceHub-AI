import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

// POST - Accept invitation
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { userId: clerkUserId } = await auth();

        if (!clerkUserId) {
            return NextResponse.json(
                { error: 'You must be logged in to accept an invitation' },
                { status: 401 }
            );
        }

        const { token } = await params;

        // Get invitation
        const invite = await prisma.groupInvite.findUnique({
            where: { token },
            include: {
                group: true,
            },
        });

        if (!invite) {
            return NextResponse.json(
                { error: 'Invitation not found' },
                { status: 404 }
            );
        }

        // Validate invitation
        if (new Date() > invite.expiresAt) {
            return NextResponse.json(
                { error: 'This invitation has expired' },
                { status: 410 }
            );
        }

        if (invite.status === 'ACCEPTED') {
            return NextResponse.json(
                { error: 'This invitation has already been accepted' },
                { status: 400 }
            );
        }

        if (invite.status === 'REVOKED') {
            return NextResponse.json(
                { error: 'This invitation has been revoked' },
                { status: 400 }
            );
        }

        // Get or create user in DB
        let user = await getOrCreateUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Failed to authenticate user' },
                { status: 500 }
            );
        }

        // Link Clerk user to pending user if needed
        if (invite.userId && invite.userId !== user.id) {
            // Check if this is the pending user being claimed
            const pendingUser = await prisma.user.findUnique({
                where: { id: invite.userId },
            });

            if (pendingUser && pendingUser.status === 'PENDING' && !pendingUser.clerkId) {
                // Link the pending user to this Clerk account
                await prisma.user.update({
                    where: { id: pendingUser.id },
                    data: {
                        clerkId: clerkUserId,
                        status: 'ACTIVE',
                        name: user.name,
                    },
                });

                user = pendingUser;
            }
        }

        // Check if already a member
        const existingMember = await prisma.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId: invite.groupId,
                    userId: user.id,
                },
            },
        });

        if (existingMember) {
            // Mark invite as accepted even though member already exists
            await prisma.groupInvite.update({
                where: { id: invite.id },
                data: { status: 'ACCEPTED' },
            });

            return NextResponse.json({
                success: true,
                message: 'You are already a member of this group',
                group: invite.group,
            });
        }

        // Create group member and update invite in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create group member
            const member = await tx.groupMember.create({
                data: {
                    groupId: invite.groupId,
                    userId: user.id,
                    role: invite.role,
                    status: 'ACTIVE',
                },
            });

            // Update invite status
            await tx.groupInvite.update({
                where: { id: invite.id },
                data: { status: 'ACCEPTED' },
            });

            // Log activity
            await tx.activityLog.create({
                data: {
                    groupId: invite.groupId,
                    action: 'created',
                    entityType: 'member',
                    entityId: member.id,
                    details: `${user.name || user.email} accepted invitation and joined the group`,
                },
            });

            return { member };
        });

        console.log(`✅ ${user.email} accepted invitation and joined group ${invite.group.name}`);

        return NextResponse.json({
            success: true,
            message: 'Successfully joined the group',
            group: invite.group,
            member: result.member,
        });

    } catch (error) {
        console.error('❌ Error accepting invitation:', error);
        return NextResponse.json(
            { error: 'Failed to accept invitation' },
            { status: 500 }
        );
    }
}
