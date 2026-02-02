import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

// PATCH - Update group (admin only)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getOrCreateUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { name, description } = body;

        console.log('📝 Update group request:', { groupId: id, name, userId: user.id });

        if (!name || !name.trim()) {
            return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
        }

        // Check if user is admin of this group
        const membership = await prisma.groupMember.findFirst({
            where: {
                groupId: id,
                userId: user.id,
                role: 'admin',
            },
        });

        console.log('🔍 Membership check:', membership ? 'Admin verified' : 'Not admin');

        if (!membership) {
            return NextResponse.json(
                { error: 'Only group admins can edit the group' },
                { status: 403 }
            );
        }

        // Update group
        const updatedGroup = await prisma.group.update({
            where: { id },
            data: {
                name: name.trim(),
                description: description?.trim() || null,
            },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                groupId: id,
                action: 'updated',
                entityType: 'group',
                entityId: id,
                details: `${user.name || 'User'} updated group name to "${updatedGroup.name}"`,
            },
        });

        console.log('✅ Group updated:', updatedGroup.name);

        return NextResponse.json({ success: true, group: updatedGroup });
    } catch (error) {
        console.error('❌ Error updating group:', error);
        return NextResponse.json(
            { error: 'Failed to update group' },
            { status: 500 }
        );
    }
}

// DELETE - Delete group (admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getOrCreateUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Check if user is admin of this group
        const membership = await prisma.groupMember.findFirst({
            where: {
                groupId: id,
                userId: user.id,
                role: 'admin',
            },
            include: {
                group: true,
            },
        });

        if (!membership) {
            return NextResponse.json(
                { error: 'Only group admins can delete the group' },
                { status: 403 }
            );
        }

        const groupName = membership.group.name;

        // Delete group and all related data (cascade deletes will handle members, expenses, etc.)
        await prisma.group.delete({
            where: { id },
        });

        console.log('✅ Group deleted:', groupName);

        return NextResponse.json({ success: true, message: 'Group deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting group:', error);
        return NextResponse.json(
            { error: 'Failed to delete group' },
            { status: 500 }
        );
    }
}
