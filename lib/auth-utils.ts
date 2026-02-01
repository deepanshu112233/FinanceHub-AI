import { currentUser } from '@clerk/nextjs/server';
import { prisma } from './db';

/**
 * Gets or creates a user in our database based on the Clerk user
 * This ensures that authenticated users always have a corresponding database record
 * Also handles linking pending users to Clerk accounts
 */
export async function getOrCreateUser() {
    const clerkUser = await currentUser();

    if (!clerkUser) {
        return null;
    }

    // Try to find user by clerkId
    let user = await prisma.user.findUnique({
        where: { clerkId: clerkUser.id },
    });

    if (user) {
        // If user status was PENDING, update to ACTIVE now that they have Clerk account
        if (user.status === 'PENDING') {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { status: 'ACTIVE' },
            });
        }
        return user;
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';

    // Check if a pending user exists with this email
    const pendingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (pendingUser && !pendingUser.clerkId) {
        // Link the pending user to this Clerk account
        const firstName = clerkUser.firstName || '';
        const lastName = clerkUser.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();

        user = await prisma.user.update({
            where: { id: pendingUser.id },
            data: {
                clerkId: clerkUser.id,
                status: 'ACTIVE',
                name: fullName || pendingUser.name || email.split('@')[0],
            },
        });

        console.log(`✅ Linked pending user ${user.email} to Clerk account`);
        return user;
    }

    // Create or update user (upsert to handle case where user exists but wasn't found)
    const firstName = clerkUser.firstName || '';
    const lastName = clerkUser.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const userName = email.split('@')[0];

    try {
        user = await prisma.user.upsert({
            where: { email },
            update: {
                clerkId: clerkUser.id,
                status: 'ACTIVE',
                name: fullName || userName || 'User',
            },
            create: {
                clerkId: clerkUser.id,
                email,
                name: fullName || userName || 'User',
                status: 'ACTIVE',
            },
        });

        console.log(`✅ User authenticated: ${user.email}`);
        return user;
    } catch (error) {
        console.error('❌ Error creating/updating user:', error);
        throw error;
    }
}
