import { NextRequest, NextResponse } from 'next/server';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, isGoogleSignIn } = body;

    if (isGoogleSignIn) {
      // Google Sign-In
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      return NextResponse.json({
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        }
      });
    } else {
      // Email/Password Sign-In
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      return NextResponse.json({
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        }
      });
    }
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
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
