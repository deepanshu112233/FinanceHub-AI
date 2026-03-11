import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/',
]);

import { rateLimit } from '@daveyplate/next-rate-limit';

export default clerkMiddleware(async (auth, request) => {
    // 1. First, check rate limiting for API routes to prevent spam
    if (request.nextUrl.pathname.startsWith('/api')) {
        const rateLimitResponse = await rateLimit({
            request,
            // Response object won't be used actively but rate limiter expects it 
            // We use the Next.js standard approach for this package
            response: new NextResponse(null, { status: 200 }),
            ipLimit: 100, // 100 requests
            ipWindow: 60, // per 60 seconds
        });

        // If the library returns a response instance (typically a 429), block the request
        if (rateLimitResponse && rateLimitResponse.status === 429) {
            return rateLimitResponse;
        }
    }

    // 2. Then run Clerk Auth Protection
    if (!isPublicRoute(request)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
