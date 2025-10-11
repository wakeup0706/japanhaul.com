import { NextRequest, NextResponse } from 'next/server';

// Admin users list - in production, store this in a database
const ADMIN_USERS = [
    'admin@japanhaul.com', // Add your admin email here
    // Add more admin emails as needed
];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { uid, email } = body;

        if (!uid || !email) {
            return NextResponse.json(
                { error: 'UID and email are required' },
                { status: 400 }
            );
        }

        // Check if user email is in admin list
        const isAdmin = ADMIN_USERS.includes(email);

        return NextResponse.json({
            isAdmin,
            email,
            uid,
        });

    } catch (error) {
        console.error('Check access error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
