import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protect admin routes (with or without language prefix)
    if (pathname.startsWith('/admin') || pathname.match(/^\/[a-z]{2}\/admin/)) {
        // Allow access to login pages
        if (pathname.endsWith('/admin/login')) {
            return NextResponse.next();
        }

        // For protected admin routes, redirect to appropriate login page
        // Extract language prefix if present
        const langMatch = pathname.match(/^\/([a-z]{2})\//);
        const lang = langMatch ? langMatch[1] : '';

        // Create login URL with proper language prefix
        const loginUrl = new URL(`/${lang}/admin/login`, request.url);
        if (pathname !== `/${lang}/admin/login`) {
            loginUrl.searchParams.set('redirect', pathname);
        }

        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
