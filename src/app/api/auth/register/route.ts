import { NextRequest, NextResponse } from 'next/server';
// Note: Removed Firebase client SDK imports - these should only be used client-side

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, isGoogleSignIn, uid, displayName, photoURL } = body;

    if (isGoogleSignIn) {
      // Google Sign-In - Firebase Auth is handled client-side
      // Here we only handle server-side operations if needed
      // For now, just return success since auth is handled client-side

      return NextResponse.json({
        success: true,
        user: {
          uid,
          email,
          displayName,
          photoURL,
        }
      });
    } else {
      // Email/Password Registration - This should also be handled client-side
      // API route should only handle server-side operations like database storage

      return NextResponse.json({
        success: true,
        user: {
          uid: 'temp-uid', // This should come from client-side Firebase auth
          email,
          displayName: name,
          photoURL: null,
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 400 }
    );
  }
}
