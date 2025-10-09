import { NextRequest, NextResponse } from 'next/server';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, isGoogleSignIn } = body;

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
      // Email/Password Registration
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update the user's display name
      if (name) {
        await updateProfile(user, {
          displayName: name
        });
      }

      return NextResponse.json({
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || name,
          photoURL: user.photoURL,
        }
      });
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
