import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

// POST create a new Clerk organization
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
        const { name } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Organization name is required' },
                { status: 400 }
            );
        }

        // Create Clerk organization
        const client = await clerkClient();
        const organization = await client.organizations.createOrganization({
            name,
            createdBy: userId,
        });

        console.log('✅ Clerk organization created:', organization.id);

        return NextResponse.json({
            success: true,
            organization: {
                id: organization.id,
                name: organization.name,
            },
        });
    } catch (error) {
        console.error('❌ Error creating Clerk organization:', error);
        return NextResponse.json(
            { error: 'Failed to create organization' },
            { status: 500 }
        );
    }
}
