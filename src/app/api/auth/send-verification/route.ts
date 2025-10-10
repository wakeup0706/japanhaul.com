import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, verificationCode, name }: { email: string; verificationCode: string; name: string } = await request.json();

    // Use Firebase Functions to send email (recommended approach)
    const firebaseFunctionUrl = process.env.FIREBASE_FUNCTIONS_SEND_EMAIL_URL;

    if (firebaseFunctionUrl) {
      // Call Firebase Function to send email
      const response = await fetch(firebaseFunctionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          templateId: 'verification-email',
          data: {
            name: name,
            verificationCode: verificationCode,
            displayName: name || email.split('@')[0]
          }
        })
      });

      if (response.ok) {
        console.log(`✅ Verification email sent via Firebase Functions to ${email}`);
        return NextResponse.json({ success: true });
      } else {
        console.error('Firebase Functions error:', await response.text());
      }
    }

    // Fallback: Use console logging for development (emails won't be sent)
    console.log(`
      📧 VERIFICATION EMAIL (NOT SENT - Use Firebase Functions or Resend)

      From: noreply@japanihaul.firebaseapp.com
      To: ${name} <${email}>
      Subject: Verify your JapanHaul account

      Hi ${name},

      Your verification code is: ${verificationCode}

      Enter this code to complete your registration.

      Best regards,
      JapanHaul Team

      To send real emails, set up:
      1. Firebase Functions (recommended): See setup instructions below
      2. Or use Resend: https://resend.com (add RESEND_API_KEY to .env.local)
    `);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to send verification email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}
