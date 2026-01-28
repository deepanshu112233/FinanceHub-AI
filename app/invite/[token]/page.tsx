"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface InviteData {
    id: string;
    email: string;
    role: string;
    status: string;
    expiresAt: string;
    group: {
        id: string;
        name: string;
        description?: string;
    };
    invitedBy: {
        name?: string;
        email: string;
    };
}

export default function InvitePage({ params }: { params: { token: string } }) {
    const router = useRouter();
    const { isSignedIn, isLoaded } = useAuth();
    const [invite, setInvite] = useState<InviteData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAccepting, setIsAccepting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchInvite = async () => {
            try {
                const response = await fetch(`/api/invites/${params.token}`);
                const data = await response.json();

                if (!response.ok) {
                    setError(data.error || 'Failed to load invitation');
                    return;
                }

                setInvite(data.invite);
            } catch (err) {
                setError('Failed to load invitation');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInvite();
    }, [params.token]);

    const handleAccept = async () => {
        if (!isSignedIn) {
            // Redirect to sign in with return URL
            router.push(`/sign-in?redirect_url=/invite/${params.token}`);
            return;
        }

        try {
            setIsAccepting(true);
            const response = await fetch(`/api/invites/${params.token}/accept`, {
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to accept invitation');
                return;
            }

            // Success! Redirect to group
            router.push(`/groups?joined=${data.group.id}`);
        } catch (err) {
            setError('Failed to accept invitation');
        } finally {
            setIsAccepting(false);
        }
    };

    if (!isLoaded || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-black p-4">
                <Card className="max-w-md w-full p-8 text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                        Invalid Invitation
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-6">{error}</p>
                    <Button onClick={() => router.push('/groups')}>
                        Go to Groups
                    </Button>
                </Card>
            </div>
        );
    }

    if (!invite) {
        return null;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-black p-4">
            <Card className="max-w-md w-full p-8">
                <div className="text-center mb-6">
                    <div className="text-6xl mb-4">✉️</div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                        You're Invited!
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        {invite.invitedBy.name || invite.invitedBy.email} has invited you to join
                    </p>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-lg text-white mb-6">
                    <h2 className="text-2xl font-bold mb-2">{invite.group.name}</h2>
                    {invite.group.description && (
                        <p className="text-blue-100">{invite.group.description}</p>
                    )}
                </div>

                <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500 dark:text-zinc-400">Role</span>
                        <span className="font-medium text-zinc-900 dark:text-white capitalize">
                            {invite.role}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500 dark:text-zinc-400">Invited to</span>
                        <span className="font-medium text-zinc-900 dark:text-white">
                            {invite.email}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500 dark:text-zinc-400">Expires</span>
                        <span className="font-medium text-zinc-900 dark:text-white">
                            {new Date(invite.expiresAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                <Button
                    onClick={handleAccept}
                    disabled={isAccepting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                    {isAccepting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Accepting...
                        </>
                    ) : isSignedIn ? (
                        'Accept Invitation'
                    ) : (
                        'Sign In to Accept'
                    )}
                </Button>

                {!isSignedIn && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-4">
                        You'll be redirected to sign in or create an account
                    </p>
                )}
            </Card>
        </div>
    );
}
