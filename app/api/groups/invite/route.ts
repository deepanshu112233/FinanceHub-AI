import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

// POST invite users to a Clerk organization
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { clerkOrgId, emails } = body;

        if (!clerkOrgId || !emails || !Array.isArray(emails)) {
            return NextResponse.json(
                { error: 'Organization ID and emails array are required' },
                { status: 400 }
            );
        }

        const client = await clerkClient();
        const results = [];

        // Send invitations to each email
        for (const email of emails) {
            try {
                const invitation = await client.organizations.createOrganizationInvitation({
                    organizationId: clerkOrgId,
                    emailAddress: email,
                    role: 'org:member', // Default role for invited members
                });

                results.push({
                    email,
                    success: true,
                    invitationId: invitation.id,
                });

                console.log(`✅ Invitation sent to ${email}`);
            } catch (err: any) {
                console.error(`❌ Failed to invite ${email}:`, err);
                results.push({
                    email,
                    success: false,
                    error: err.message,
                });
            }
        }

        return NextResponse.json({
            success: true,
            results,
        });
    } catch (error) {
        console.error('❌ Error sending invitations:', error);
        return NextResponse.json(
            { error: 'Failed to send invitations' },
            { status: 500 }
        );
    }
}
