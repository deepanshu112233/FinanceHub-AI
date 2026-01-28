import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { auth, clerkClient } from '@clerk/nextjs/server';

// POST - Create invitation
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getOrCreateUser();
        const { userId: clerkUserId } = await auth();

        if (!user || !clerkUserId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id: groupId } = await params;
        const body = await request.json();
        const { email, role = 'member' } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Verify user is admin of this group
        const membershipCheck = await prisma.groupMember.findFirst({
            where: {
                groupId,
                userId: user.id,
                role: 'admin',
            },
        });

        if (!membershipCheck) {
            return NextResponse.json(
                { error: 'Only admins can invite members' },
                { status: 403 }
            );
        }

        // ===== CASE 1: Check if email exists in Clerk with active account =====
        const client = await clerkClient();
        let clerkUser = null;
        try {
            const users = await client.users.getUserList({ emailAddress: [email] });
            clerkUser = users.data[0] || null;
        } catch (err) {
            console.log('Email not found in Clerk, proceeding with invitation flow');
        }

        if (clerkUser) {
            // User has Clerk account - add directly as group member

            // Find or create user in our DB
            let dbUser = await prisma.user.findUnique({
                where: { clerkId: clerkUser.id },
            });

            if (!dbUser) {
                dbUser = await prisma.user.create({
                    data: {
                        clerkId: clerkUser.id,
                        email: clerkUser.emailAddresses[0]?.emailAddress || email,
                        name: clerkUser.firstName
                            ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim()
                            : null,
                        status: 'ACTIVE',
                    },
                });
            }

            // Check if already a member
            const existingMember = await prisma.groupMember.findUnique({
                where: {
                    groupId_userId: {
                        groupId,
                        userId: dbUser.id,
                    },
                },
            });

            if (existingMember) {
                return NextResponse.json(
                    { error: 'User is already a member of this group' },
                    { status: 400 }
                );
            }

            // Add directly as ACTIVE member
            const member = await prisma.groupMember.create({
                data: {
                    groupId,
                    userId: dbUser.id,
                    role,
                    status: 'ACTIVE',
                },
            });

            return NextResponse.json({
                success: true,
                type: 'direct_add',
                message: 'User added directly to group',
                member,
            });
        }

        // ===== CASE 2 & 3: Email not in Clerk - create/find pending user and send invite =====

        // Find or create pending user
        let pendingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (!pendingUser) {
            pendingUser = await prisma.user.create({
                data: {
                    email,
                    clerkId: null,
                    status: 'PENDING',
                    name: null,
                },
            });
        }

        // Check if invite already exists and is not expired/revoked
        const existingInvite = await prisma.groupInvite.findFirst({
            where: {
                groupId,
                email,
                status: {
                    in: ['INVITED', 'ACCEPTED'],
                },
            },
        });

        if (existingInvite) {
            if (existingInvite.status === 'ACCEPTED') {
                return NextResponse.json(
                    { error: 'User has already accepted an invitation to this group' },
                    { status: 400 }
                );
            }

            return NextResponse.json(
                { error: 'An active invitation already exists for this email' },
                { status: 400 }
            );
        }

        // Check if already a member (even if pending)
        const existingMember = await prisma.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId,
                    userId: pendingUser.id,
                },
            },
        });

        if (existingMember) {
            return NextResponse.json(
                { error: 'User is already a member of this group' },
                { status: 400 }
            );
        }

        // Create invitation with 7-day expiry
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Create both invite and pending group member in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create the invite
            const invite = await tx.groupInvite.create({
                data: {
                    groupId,
                    email,
                    userId: pendingUser.id,
                    role,
                    invitedById: user.id,
                    expiresAt,
                    status: 'INVITED',
                },
                include: {
                    group: true,
                    invitedBy: true,
                },
            });

            // Create a PENDING group member
            const member = await tx.groupMember.create({
                data: {
                    groupId,
                    userId: pendingUser.id,
                    role,
                    status: 'PENDING',
                },
            });

            return { invite, member };
        });

        // TODO: Send email with invite link
        // Email should contain: process.env.NEXT_PUBLIC_APP_URL + '/invite/' + invite.token

        console.log(`✉️  Invitation created for ${email}. Token: ${result.invite.token}`);
        console.log(`   Invite link: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${result.invite.token}`);

        return NextResponse.json({
            success: true,
            type: 'invitation_sent',
            message: 'Invitation sent successfully',
            invite: {
                id: result.invite.id,
                email: result.invite.email,
                token: result.invite.token,
                expiresAt: result.invite.expiresAt,
                inviteLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${result.invite.token}`,
            },
        });

    } catch (error) {
        console.error('❌ Error creating invitation:', error);
        return NextResponse.json(
            { error: 'Failed to create invitation' },
            { status: 500 }
        );
    }
}

// GET - List all invitations for this group
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getOrCreateUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id: groupId } = await params;

        // Verify user is member of this group
        const membershipCheck = await prisma.groupMember.findFirst({
            where: {
                groupId,
                userId: user.id,
            },
        });

        if (!membershipCheck) {
            return NextResponse.json(
                { error: 'You are not a member of this group' },
                { status: 403 }
            );
        }

        // Get all invitations
        const invites = await prisma.groupInvite.findMany({
            where: {
                groupId,
            },
            include: {
                invitedBy: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ invites });
    } catch (error) {
        console.error('❌ Error fetching invitations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch invitations' },
            { status: 500 }
        );
    }
}
