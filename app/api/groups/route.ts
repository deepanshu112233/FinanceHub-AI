import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

// GET all groups for the current user
export async function GET(request: NextRequest) {
    try {
        const user = await getOrCreateUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get all groups where user is a member
        const groupMemberships = await prisma.groupMember.findMany({
            where: {
                userId: user.id,
            },
            include: {
                group: {
                    include: {
                        members: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                        _count: {
                            select: {
                                members: true,
                            },
                        },
                    },
                },
            },
        });

        // Calculate balance for each group
        const groupsWithBalances = groupMemberships.map((membership) => {
            return {
                id: membership.group.id,
                name: membership.group.name,
                description: membership.group.description,
                memberCount: membership.group._count.members,
                balance: 0, // Balance calculation is expensive, only calculate when viewing specific group
                role: membership.role,
                createdAt: membership.group.createdAt,
            };
        });

        console.log(`📊 Fetched ${groupsWithBalances.length} groups for user ${user.id}:`,
            groupsWithBalances.map(g => g.name).join(', '));

        return NextResponse.json({ groups: groupsWithBalances });
    } catch (error) {
        console.error('❌ Error fetching groups:', error);
        return NextResponse.json(
            { error: 'Failed to fetch groups' },
            { status: 500 }
        );
    }
}

// POST create a new group
export async function POST(request: NextRequest) {
    try {
        const user = await getOrCreateUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, description, clerkOrgId } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Group name is required' },
                { status: 400 }
            );
        }

        // Create group and add creator as admin member in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const group = await tx.group.create({
                data: {
                    name,
                    description: description || null,
                    clerkOrgId: clerkOrgId || null,
                    createdById: user.id,
                },
            });

            // Add creator as admin member
            const membershipData = await tx.groupMember.create({
                data: {
                    groupId: group.id,
                    userId: user.id,
                    role: 'admin',
                    status: 'ACTIVE',
                },
            });

            // Log group creation in activity log
            await tx.activityLog.create({
                data: {
                    groupId: group.id,
                    action: 'created',
                    entityType: 'group',
                    entityId: group.id,
                    details: `${user.name || 'User'} created group "${name}"${description ? ` - ${description}` : ''}`,
                },
            });

            return { group, membership: membershipData };
        });

        console.log('✅ Group created:', result.group.name);

        return NextResponse.json({
            success: true,
            group: result.group,
            membership: result.membership,
        });
    } catch (error) {
        console.error('❌ Error creating group:', error);
        return NextResponse.json(
            { error: 'Failed to create group' },
            { status: 500 }
        );
    }
}
