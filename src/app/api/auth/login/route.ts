import { NextRequest, NextResponse } from 'next/server';
// Note: Removed Firebase client SDK imports - these should only be used client-side

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, isGoogleSignIn, uid, displayName, photoURL } = body;

    if (isGoogleSignIn) {
      // Google Sign-In - Firebase Auth is handled client-side
      // Here we only handle server-side operations if needed

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
      // Email/Password Sign-In - This should also be handled client-side
      // API route should only handle server-side operations like database storage

      return NextResponse.json({
        success: true,
        user: {
          uid: 'temp-uid', // This should come from client-side Firebase auth
          email,
          displayName: null,
          photoURL: null,
        }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Login failed' },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  if (mode === 'resetPassword' && oobCode) {
    // Handle password reset callback
    return NextResponse.redirect(new URL(`/reset-password?mode=${mode}&oobCode=${oobCode}`, request.url));
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}
