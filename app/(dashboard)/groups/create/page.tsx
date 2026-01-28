'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function CreateGroupPage() {
    const router = useRouter();
    const { organization: clerkOrg, isLoaded } = useOrganization();
    const [name, setName] = useState('');
    const [inviteEmails, setInviteEmails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // Step 1: Create Clerk organization
            const { organization } = await fetch('/api/clerk/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            }).then(res => res.json());

            if (!organization?.id) {
                throw new Error('Failed to create Clerk organization');
            }

            // Step 2: Create group in our database with Clerk org ID
            const response = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    clerkOrgId: organization.id,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create group');
            }

            const { group } = await response.json();

            // Step 3: Send invitations if emails provided
            if (inviteEmails.trim()) {
                const emails = inviteEmails
                    .split(',')
                    .map(e => e.trim())
                    .filter(e => e);

                // Send invitations for each email
                for (const email of emails) {
                    try {
                        await fetch(`/api/groups/${group.id}/invites`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email,
                                role: 'member',
                            }),
                        });
                        console.log(`✅ Sent invitation to ${email}`);
                    } catch (err) {
                        console.error(`❌ Failed to invite ${email}:`, err);
                        // Continue with other invitations even if one fails
                    }
                }
            }

            // Success! Navigate back to groups page
            router.push('/groups');
            router.refresh(); // Force refresh to reload data
        } catch (err: any) {
            console.error('Failed to create group:', err);
            setError(err.message || 'An error occurred while creating the group');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/groups"
                        className="inline-flex items-center text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Groups
                    </Link>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                        Create New Group
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-2">
                        Create a group to split expenses with friends, roommates, or colleagues.
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Group Name */}
                        <div className="space-y-2">
                            <Label htmlFor="group-name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Group Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="group-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Housemates, Trip to Bali, Office Lunch..."
                                required
                                className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700"
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Invite Emails */}
                        <div className="space-y-2">
                            <Label htmlFor="invite-emails" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                <div className="flex items-center gap-2">
                                    <UserPlus className="w-4 h-4" />
                                    Invite Members (Optional)
                                </div>
                            </Label>
                            <Input
                                id="invite-emails"
                                type="text"
                                value={inviteEmails}
                                onChange={(e) => setInviteEmails(e.target.value)}
                                placeholder="Enter email addresses separated by commas"
                                className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700"
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Example: friend@email.com, colleague@company.com
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/groups')}
                                className="flex-1"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={isSubmitting || !name.trim()}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Group'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        What happens next?
                    </h3>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• You'll be set as the group admin automatically</li>
                        <li>• Invited members will receive an email invitation</li>
                        <li>• You can add expenses and split them with group members</li>
                        <li>• Track who owes whom and settle balances easily</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
